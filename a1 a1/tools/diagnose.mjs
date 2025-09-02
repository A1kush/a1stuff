#!/usr/bin/env node
// Minimal diagnostic harness: launches Edge headless with remote debugging,
// opens the provided URL (defaults to local a1 12.html), and captures
// console logs, exceptions, and network failures for a short window.

import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import CDP from 'chrome-remote-interface';

import { existsSync } from 'node:fs';

function findEdge() {
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return 'msedge.exe';
}

function toFileUrl(winPath) {
  const p = resolve(winPath).replace(/\\/g, '/');
  return 'file:///' + encodeURI(p);
}

async function waitForDevTools(port, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return true;
    } catch {}
    await delay(200);
  }
  throw new Error('DevTools endpoint did not become ready');
}

function parseArgs(argv) {
  const out = { simulate: false, url: undefined };
  for (const a of argv) {
    if (a === '--simulate' || a === '-s') out.simulate = true;
    else if (!a.startsWith('-') && !out.url) out.url = a;
  }
  return out;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const edgePath = findEdge();
  const port = 9222; // fixed for simplicity
  const target = parsed.url ? parsed.url : toFileUrl('a1 12.html');
  const userDataDir = join(tmpdir(), `edge-harness-${Date.now()}`);

  const child = spawn(edgePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true });

  let killed = false;
  const kill = () => {
    if (!killed) {
      killed = true;
      try { child.kill('SIGKILL'); } catch {}
    }
  };

  try {
    await waitForDevTools(port);
    const browser = await CDP({ host: '127.0.0.1', port });
    const { Target } = browser;
    const { targetId } = await Target.createTarget({ url: 'about:blank' });
    const client = await CDP({ host: '127.0.0.1', port, target: targetId });
    const { Page, Runtime, Network, Log, Input, Emulation } = client;

    const logs = [];
    const push = (kind, data) => logs.push({ t: Date.now(), kind, ...data });

    await Promise.all([
      Page.enable(),
      Runtime.enable(),
      Network.enable(),
      Log.enable(),
    ]);

    Runtime.consoleAPICalled(params => {
      const text = (params.args || []).map(a => a.value ?? a.description ?? '').join(' ');
      push('console', { type: params.type, text });
    });
    Runtime.exceptionThrown(params => {
      push('exception', { text: params.exceptionDetails?.text || 'Exception thrown' });
    });
    Log.entryAdded(params => {
      const e = params.entry || {};
      push('log', { level: e.level, text: e.text });
    });
    Network.loadingFailed(params => {
      // Ignore cancelled
      if (params.errorText && params.errorText !== 'net::ERR_ABORTED') {
        push('netfail', { url: params?.request?.url || '', error: params.errorText });
      }
    });
    Network.responseReceived(params => {
      const { response } = params;
      if (response && response.status >= 400) {
        push('http', { status: response.status, url: response.url });
      }
    });

    // Set a larger viewport for canvas games
    await Emulation.setDeviceMetricsOverride({
      width: 1280, height: 720, deviceScaleFactor: 1, mobile: false,
    });
    await Emulation.setVisibleSize({ width: 1280, height: 720 });
    await Page.navigate({ url: target });
    // Wait for load + a short idle window
    await new Promise(resolve => Page.loadEventFired(resolve));
    await delay(2000);
    // Capture screenshot for visual sanity check
    try {
      const snap = await Page.captureScreenshot({ format: 'png' });
      const buf = Buffer.from(snap.data, 'base64');
      const snapPath = join(process.cwd(), 'tools', 'screenshot.png');
      await writeFile(snapPath, buf);
      console.log('Screenshot saved to', snapPath);
    } catch (e) {
      console.warn('Screenshot failed:', e?.message || e);
    }

    if (parsed.simulate) {
      // Try to focus the document for key events
      try { await Runtime.evaluate({ expression: 'window.focus && window.focus()' }); } catch {}
      // Center click to focus canvas
      try {
        await Input.dispatchMouseEvent({ type: 'mouseMoved', x: 640, y: 360, buttons: 0 });
        await Input.dispatchMouseEvent({ type: 'mousePressed', x: 640, y: 360, button: 'left', clickCount: 1 });
        await Input.dispatchMouseEvent({ type: 'mouseReleased', x: 640, y: 360, button: 'left', clickCount: 1 });
      } catch {}
      // Send some common gameplay keys: D/right, A/left, Space
      const keys = [
        { key: 'd', code: 'KeyD' },
        { key: 'ArrowRight', code: 'ArrowRight' },
        { key: 'a', code: 'KeyA' },
        { key: 'ArrowLeft', code: 'ArrowLeft' },
        { key: ' ', code: 'Space' },
      ];
      for (const k of keys) {
        try {
          await Input.dispatchKeyEvent({ type: 'keyDown', key: k.key, code: k.code });
          await delay(100);
          await Input.dispatchKeyEvent({ type: 'keyUp', key: k.key, code: k.code });
        } catch {}
      }
      await delay(500);
      // Second screenshot after interactions
      try {
        const snap2 = await Page.captureScreenshot({ format: 'png' });
        const buf2 = Buffer.from(snap2.data, 'base64');
        const snapPath2 = join(process.cwd(), 'tools', 'screenshot_after.png');
        await writeFile(snapPath2, buf2);
        console.log('Post-interaction screenshot saved to', snapPath2);
      } catch (e) {
        console.warn('Post-interaction screenshot failed:', e?.message || e);
      }
    }

    // Summarize
    const summary = {
      url: target,
      issues: logs.filter(l => ['exception', 'netfail', 'http'].includes(l.kind)),
      console: logs.filter(l => l.kind === 'console'),
    };

    const outPath = join(process.cwd(), 'tools', 'diagnostics.json');
    await writeFile(outPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log('Diagnostics saved to', outPath);
    console.log('Issue counts:', {
      exceptions: summary.issues.filter(i => i.kind === 'exception').length,
      netErrors: summary.issues.filter(i => i.kind === 'netfail').length,
      http4xx5xx: summary.issues.filter(i => i.kind === 'http').length,
      console: summary.console.length,
    });

    await client.close();
    await browser.close();
  } catch (err) {
    console.error('Diagnostic error:', err.message || err);
    process.exitCode = 1;
  } finally {
    kill();
  }
}

main();
