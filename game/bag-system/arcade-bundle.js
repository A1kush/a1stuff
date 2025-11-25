/**
 * A1K ARCADE SYSTEM - GAMES MODULE
 * Contains all 5 betting games: Slots, RPS, Dice, Wheel, High-Low
 * Version: 1.0.0
 *
 * This module is automatically attached to BagSystem by arcade-core.js
 */

(function() {
  'use strict';

  // Arcade Games Namespace
  window.ArcadeGames = window.ArcadeGames || {
    version: '1.0.0',

    /**
     * Common helper: Update gold display
     */
    updateGoldDisplay() {
      const display = document.getElementById('arcadeGoldDisplay');
      if (display && window.gameState) {
        display.textContent = (window.gameState.gold || 0).toLocaleString();
      }
      // Sync currency to game
      if (typeof window.syncCurrencyToBag === 'function') {
        window.syncCurrencyToBag();
      }
    },

    /**
     * Common helper: Get bet amount buttons HTML
     */
    getBetButtonsHTML(prefix = 'bet-btn') {
      return `
        <button class="${prefix}" data-amount="100">100</button>
        <button class="${prefix}" data-amount="500">500</button>
        <button class="${prefix}" data-amount="1000">1K</button>
        <button class="${prefix}" data-amount="5000">5K</button>
        <button class="${prefix}" data-amount="10000">10K</button>
        <button class="${prefix}" data-amount="20000">20K MAX</button>
      `;
    },

    /**
     * Common helper: Setup bet buttons
     */
    setupBetButtons(selector, displaySelector, context) {
      const btns = document.querySelectorAll(selector);
      const display = document.querySelector(displaySelector);

      btns.forEach(btn => {
        btn.style.cssText = 'padding: 8px 16px; background: rgba(76, 209, 55, 0.3); border: 2px solid rgba(76, 209, 55, 0.5); border-radius: 8px; color: #4cd137; font-weight: 700; cursor: pointer;';
        btn.addEventListener('click', () => {
          context.state.arcadeBet = parseInt(btn.dataset.amount);
          if (display) display.textContent = context.state.arcadeBet.toLocaleString();
        });
      });
    },

    // ========== SLOT MACHINE GAME ==========
    renderSlotsGame(display) {
      display.innerHTML = `
        <div class="game-container slots-game">
          <h3 class="game-title">🎰 SLOT MACHINE</h3>

          <div class="game-display">
            <div id="slotReels" class="slot-reels">
              <div class="slot-reel">🍒</div>
              <div class="slot-reel">🍋</div>
              <div class="slot-reel">🍊</div>
            </div>
            <div id="slotResult" class="game-result"></div>
          </div>

          <div class="betting-controls">
            <label>Bet Amount:</label>
            <div class="bet-buttons">
              ${window.ArcadeGames.getBetButtonsHTML('bet-btn')}
            </div>
            <div class="current-bet">Current Bet: <span id="slotBetDisplay">1000</span> 💰</div>
          </div>

          <div class="game-actions">
            <button id="spinBtn" class="action-btn primary">🎰 SPIN!</button>
            <button id="backToArcadeBtn" class="action-btn secondary">← Back</button>
          </div>

          <div class="game-rules">
            <h4>💰 Paytable</h4>
            <div class="rules-grid">
              <div>💎💎💎 = 100x bet (JACKPOT!)</div>
              <div>🍒🍒🍒 = 50x bet</div>
              <div>🍋🍋🍋 = 30x bet</div>
              <div>🍊🍊🍊 = 20x bet</div>
              <div>🍇🍇🍇 = 15x bet</div>
              <div>⭐⭐⭐ = 10x bet</div>
              <div>Any 2 matching = 2x bet</div>
              <div style="color: #ff6b35;">Max bet 20K = 2M win!</div>
            </div>
          </div>
        </div>
      `;

      setTimeout(() => {
        window.ArcadeGames.setupBetButtons('.bet-btn', '#slotBetDisplay', this);
        document.getElementById('spinBtn').addEventListener('click', () => this.playSlotsGame());
        document.getElementById('backToArcadeBtn').addEventListener('click', () => {
          const container = document.getElementById('map-subtab-content');
          if (container) this.renderArcadeSubtab(container);
        });
      }, 50);
    },

    playSlotsGame() {
      const bet = this.state.arcadeBet;

      if (window.gameState.gold < bet) {
        this.showToast('❌ Not enough gold!');
        return;
      }

      window.gameState.gold -= bet;
      // Sync currency to game after bet
      if (typeof window.syncCurrencyToBag === 'function') {
          window.syncCurrencyToBag();
      }
      window.ArcadeGames.updateGoldDisplay();
      if (this.updateStats) this.updateStats();

      const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎'];
      const reels = document.querySelectorAll('.slot-reel');
      const resultDiv = document.getElementById('slotResult');
      const spinBtn = document.getElementById('spinBtn');

      spinBtn.disabled = true;
      spinBtn.style.opacity = '0.5';
      resultDiv.textContent = '🎰 SPINNING...';

      let spinCount = 0;
      const spinInterval = setInterval(() => {
        reels.forEach(reel => {
          reel.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        });
        spinCount++;
        if (spinCount > 20) {
          clearInterval(spinInterval);

          const result = [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)]
          ];

          reels[0].textContent = result[0];
          reels[1].textContent = result[1];
          reels[2].textContent = result[2];

          let multiplier = 0;
          if (result[0] === result[1] && result[1] === result[2]) {
            if (result[0] === '💎') multiplier = 100;
            else if (result[0] === '🍒') multiplier = 50;
            else if (result[0] === '🍋') multiplier = 30;
            else if (result[0] === '🍊') multiplier = 20;
            else if (result[0] === '🍇') multiplier = 15;
            else if (result[0] === '⭐') multiplier = 10;
          } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
            multiplier = 2;
          }

          const winnings = bet * multiplier;
          if (winnings > 0) {
            window.gameState.gold += winnings;
        // Sync currency to game after win
        if (typeof window.syncCurrencyToBag === 'function') {
            window.syncCurrencyToBag();
        }
            window.ArcadeGames.updateGoldDisplay();
            if (this.updateStats) this.updateStats();

            if (multiplier >= 100) {
              resultDiv.innerHTML = `<div class="win-message jackpot">🎉 JACKPOT! WON ${winnings.toLocaleString()} GOLD! 🎉</div>`;
              this.showToast(`🎰 JACKPOT! +${winnings.toLocaleString()} gold!`);
            } else if (multiplier >= 10) {
              resultDiv.innerHTML = `<div class="win-message big-win">✨ BIG WIN! +${winnings.toLocaleString()} gold!</div>`;
              this.showToast(`🎰 Big Win! +${winnings.toLocaleString()} gold!`);
            } else {
              resultDiv.innerHTML = `<div class="win-message">✅ You won ${winnings.toLocaleString()} gold!</div>`;
              this.showToast(`🎰 Won +${winnings.toLocaleString()} gold`);
            }
          } else {
            resultDiv.innerHTML = `<div class="lose-message">❌ No match. Try again!</div>`;
            this.showToast('🎰 No match this time');
          }

          spinBtn.disabled = false;
          spinBtn.style.opacity = '1';
        }
      }, 100);
    },

    // ========== ROCK PAPER SCISSORS GAME ==========
    renderRPSGame(display) {
      display.innerHTML = `
        <div class="game-container rps-game">
          <h3 class="game-title">✊ ROCK PAPER SCISSORS</h3>

          <div class="game-display">
            <div class="rps-battle">
              <div class="rps-player">
                <div class="rps-label">YOU</div>
                <div id="rpsPlayerChoice" class="rps-choice-display">?</div>
              </div>
              <div class="rps-vs">VS</div>
              <div class="rps-dealer">
                <div class="rps-label">DEALER</div>
                <div id="rpsDealerChoice" class="rps-choice-display">?</div>
              </div>
            </div>
            <div id="rpsResult" class="game-result"></div>
          </div>

          <div class="betting-controls">
            <label>Bet Amount:</label>
            <div class="bet-buttons">
              ${window.ArcadeGames.getBetButtonsHTML('bet-btn-rps')}
            </div>
            <div class="current-bet">Current Bet: <span id="rpsBetDisplay">1000</span> 💰</div>
          </div>

          <div class="rps-choices">
            <button class="rps-choice-btn" data-choice="rock">✊</button>
            <button class="rps-choice-btn" data-choice="paper">✋</button>
            <button class="rps-choice-btn" data-choice="scissors">✌️</button>
          </div>

          <button id="backToArcadeBtn2" class="action-btn secondary">← Back to Arcade</button>

          <div class="game-rules">
            <h4>📋 Rules</h4>
            <p>✅ Win = 2x your bet</p>
            <p>🤝 Tie = Bet returned</p>
            <p>❌ Lose = Lose bet</p>
          </div>
        </div>
      `;

      setTimeout(() => {
        window.ArcadeGames.setupBetButtons('.bet-btn-rps', '#rpsBetDisplay', this);

        document.querySelectorAll('.rps-choice-btn').forEach(btn => {
          btn.addEventListener('mouseenter', function() { this.style.transform = 'scale(1.1)'; });
          btn.addEventListener('mouseleave', function() { this.style.transform = 'scale(1)'; });
          btn.addEventListener('click', (e) => {
            this.playRPSGame(e.currentTarget.dataset.choice);
          });
        });

        document.getElementById('backToArcadeBtn2').addEventListener('click', () => {
          const container = document.getElementById('map-subtab-content');
          if (container) this.renderArcadeSubtab(container);
        });
      }, 50);
    },

    playRPSGame(playerChoice) {
      const bet = this.state.arcadeBet;

      if (window.gameState.gold < bet) {
        this.showToast('❌ Not enough gold!');
        return;
      }

      window.gameState.gold -= bet;
      // Sync currency to game after bet
      if (typeof window.syncCurrencyToBag === 'function') {
          window.syncCurrencyToBag();
      }
      window.ArcadeGames.updateGoldDisplay();
      if (this.updateStats) this.updateStats();

      const choices = ['rock', 'paper', 'scissors'];
      const choiceIcons = { rock: '✊', paper: '✋', scissors: '✌️' };
      const dealerChoice = choices[Math.floor(Math.random() * 3)];

      document.getElementById('rpsPlayerChoice').textContent = choiceIcons[playerChoice];
      document.getElementById('rpsDealerChoice').textContent = choiceIcons[dealerChoice];

      let result = '';
      let winnings = 0;

      if (playerChoice === dealerChoice) {
        result = '🤝 TIE! Bet returned';
        winnings = bet;
      } else if (
        (playerChoice === 'rock' && dealerChoice === 'scissors') ||
        (playerChoice === 'paper' && dealerChoice === 'rock') ||
        (playerChoice === 'scissors' && dealerChoice === 'paper')
      ) {
        result = `✅ YOU WIN! +${(bet * 2).toLocaleString()} gold`;
        winnings = bet * 2;
        this.showToast(`✊ RPS Win! +${bet.toLocaleString()} gold`);
      } else {
        result = '❌ DEALER WINS!';
        this.showToast('✊ RPS: Dealer wins');
      }

      if (winnings > 0) {
        window.gameState.gold += winnings;
        // Sync currency to game after win
        if (typeof window.syncCurrencyToBag === 'function') {
            window.syncCurrencyToBag();
        }
        window.ArcadeGames.updateGoldDisplay();
        if (this.updateStats) this.updateStats();
      }

      document.getElementById('rpsResult').innerHTML = `<div class="${winnings > bet ? 'win-message' : winnings > 0 ? 'tie-message' : 'lose-message'}">${result}</div>`;
    },

    // ========== DICE DUEL GAME ==========
    renderDiceGame(display) {
      display.innerHTML = `
        <div class="game-container dice-game">
          <h3 class="game-title">🎲 DICE DUEL</h3>

          <div class="game-display">
            <div class="dice-battle">
              <div class="dice-player">
                <div class="dice-label">YOUR ROLL</div>
                <div id="dicePlayerRoll" class="dice-display">🎲</div>
                <div id="dicePlayerValue" class="dice-value"></div>
              </div>
              <div class="dice-vs">VS</div>
              <div class="dice-dealer">
                <div class="dice-label">DEALER ROLL</div>
                <div id="diceDealerRoll" class="dice-display">🎲</div>
                <div id="diceDealerValue" class="dice-value"></div>
              </div>
            </div>
            <div id="diceResult" class="game-result"></div>
          </div>

          <div class="betting-controls">
            <label>Bet Amount:</label>
            <div class="bet-buttons">
              ${window.ArcadeGames.getBetButtonsHTML('bet-btn-dice')}
            </div>
            <div class="current-bet">Current Bet: <span id="diceBetDisplay">1000</span> 💰</div>
          </div>

          <div class="game-actions">
            <button id="rollDiceBtn" class="action-btn primary">🎲 ROLL DICE!</button>
            <button id="backToArcadeBtn3" class="action-btn secondary">← Back</button>
          </div>

          <div class="game-rules">
            <h4>📋 Rules</h4>
            <p>Roll 2 dice (2-12). Higher total wins!</p>
            <p>✅ Win = 3x your bet</p>
            <p>🤝 Tie = Bet returned</p>
            <p>❌ Lose = Lose bet</p>
          </div>
        </div>
      `;

      setTimeout(() => {
        window.ArcadeGames.setupBetButtons('.bet-btn-dice', '#diceBetDisplay', this);
        document.getElementById('rollDiceBtn').addEventListener('click', () => this.playDiceGame());
        document.getElementById('backToArcadeBtn3').addEventListener('click', () => {
          const container = document.getElementById('map-subtab-content');
          if (container) this.renderArcadeSubtab(container);
        });
      }, 50);
    },

    playDiceGame() {
      const bet = this.state.arcadeBet;

      if (window.gameState.gold < bet) {
        this.showToast('❌ Not enough gold!');
        return;
      }

      window.gameState.gold -= bet;
      // Sync currency to game after bet
      if (typeof window.syncCurrencyToBag === 'function') {
          window.syncCurrencyToBag();
      }
      window.ArcadeGames.updateGoldDisplay();
      if (this.updateStats) this.updateStats();

      const rollBtn = document.getElementById('rollDiceBtn');
      rollBtn.disabled = true;
      rollBtn.style.opacity = '0.5';

      let rollCount = 0;
      const rollInterval = setInterval(() => {
        document.getElementById('dicePlayerRoll').textContent = '🎲';
        document.getElementById('diceDealerRoll').textContent = '🎲';
        rollCount++;

        if (rollCount > 10) {
          clearInterval(rollInterval);

          const playerRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
          const dealerRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;

          document.getElementById('dicePlayerValue').textContent = playerRoll;
          document.getElementById('diceDealerValue').textContent = dealerRoll;

          let result = '';
          let winnings = 0;

          if (playerRoll > dealerRoll) {
            result = `✅ YOU WIN! +${(bet * 3).toLocaleString()} gold`;
            winnings = bet * 3;
            this.showToast(`🎲 Dice Win! +${(bet * 2).toLocaleString()} gold`);
          } else if (playerRoll === dealerRoll) {
            result = '🤝 TIE! Bet returned';
            winnings = bet;
          } else {
            result = '❌ DEALER WINS!';
            this.showToast('🎲 Dealer rolled higher');
          }

          if (winnings > 0) {
            window.gameState.gold += winnings;
        // Sync currency to game after win
        if (typeof window.syncCurrencyToBag === 'function') {
            window.syncCurrencyToBag();
        }
            window.ArcadeGames.updateGoldDisplay();
            if (this.updateStats) this.updateStats();
          }

          document.getElementById('diceResult').innerHTML = `<div class="${winnings > bet ? 'win-message' : winnings > 0 ? 'tie-message' : 'lose-message'}">${result}</div>`;

          rollBtn.disabled = false;
          rollBtn.style.opacity = '1';
        }
      }, 150);
    },

    // ========== COLOR WHEEL GAME ==========
    renderWheelGame(display) {
      display.innerHTML = `
        <div class="game-container wheel-game">
          <h3 class="game-title">🎡 COLOR WHEEL</h3>

          <div class="game-display">
            <div id="wheelDisplay" class="color-wheel"></div>
            <div id="wheelResult" class="game-result"></div>
          </div>

          <div class="betting-controls">
            <label>Choose Your Color:</label>
            <div class="color-buttons">
              <button class="wheel-color-btn" data-color="red">🔴 RED (5x)</button>
              <button class="wheel-color-btn" data-color="green">🟢 GREEN (5x)</button>
              <button class="wheel-color-btn" data-color="blue">🔵 BLUE (5x)</button>
              <button class="wheel-color-btn" data-color="yellow">🟡 YELLOW (5x)</button>
              <button class="wheel-color-btn" data-color="purple">🟣 PURPLE (5x)</button>
            </div>
            <div class="selected-color">Selected: <span id="wheelColorDisplay">None</span></div>

            <label>Bet Amount:</label>
            <div class="bet-buttons">
              ${window.ArcadeGames.getBetButtonsHTML('bet-btn-wheel')}
            </div>
            <div class="current-bet">Current Bet: <span id="wheelBetDisplay">1000</span> 💰</div>
          </div>

          <div class="game-actions">
            <button id="spinWheelBtn" class="action-btn primary">🎡 SPIN!</button>
            <button id="backToArcadeBtn4" class="action-btn secondary">← Back</button>
          </div>

          <div class="game-rules">
            <h4>📋 Rules</h4>
            <p>Pick a color and spin the wheel!</p>
            <p>✅ Match your color = 5x your bet</p>
            <p>❌ Wrong color = Lose bet</p>
            <p>🎯 20% chance to win per color</p>
          </div>
        </div>
      `;

      setTimeout(() => {
        this.state.wheelSelectedColor = null;

        window.ArcadeGames.setupBetButtons('.bet-btn-wheel', '#wheelBetDisplay', this);

        const colorBtns = document.querySelectorAll('.wheel-color-btn');
        const colorDisplay = document.querySelector('#wheelColorDisplay');

        colorBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            colorBtns.forEach(b => b.style.opacity = '0.6');
            e.currentTarget.style.opacity = '1';
            this.state.wheelSelectedColor = e.currentTarget.dataset.color;
            colorDisplay.textContent = this.state.wheelSelectedColor.toUpperCase();
          });
        });

        document.getElementById('spinWheelBtn').addEventListener('click', () => this.playWheelGame());
        document.getElementById('backToArcadeBtn4').addEventListener('click', () => {
          const container = document.getElementById('map-subtab-content');
          if (container) this.renderArcadeSubtab(container);
        });
      }, 50);
    },

    playWheelGame() {
      const bet = this.state.arcadeBet;
      const selectedColor = this.state.wheelSelectedColor;

      if (!selectedColor) {
        this.showToast('❌ Please select a color first!');
        return;
      }

      if (window.gameState.gold < bet) {
        this.showToast('❌ Not enough gold!');
        return;
      }

      window.gameState.gold -= bet;
      // Sync currency to game after bet
      if (typeof window.syncCurrencyToBag === 'function') {
          window.syncCurrencyToBag();
      }
      window.ArcadeGames.updateGoldDisplay();
      if (this.updateStats) this.updateStats();

      const spinBtn = document.getElementById('spinWheelBtn');
      spinBtn.disabled = true;
      spinBtn.style.opacity = '0.5';

      const colors = ['red', 'green', 'blue', 'yellow', 'purple'];
      const resultColor = colors[Math.floor(Math.random() * colors.length)];
      const wheelDisplay = document.getElementById('wheelDisplay');

      const spins = 5 + Math.floor(Math.random() * 5);
      const colorIndex = colors.indexOf(resultColor);
      const finalRotation = (spins * 360) + (colorIndex * 72) + 36;

      wheelDisplay.style.transform = `rotate(${finalRotation}deg)`;

      setTimeout(() => {
        let result = '';
        let winnings = 0;

        if (selectedColor === resultColor) {
          result = `✅ ${resultColor.toUpperCase()}! YOU WIN! +${(bet * 5).toLocaleString()} gold`;
          winnings = bet * 5;
          this.showToast(`🎡 Wheel Win! +${(bet * 4).toLocaleString()} gold`);
        } else {
          result = `❌ ${resultColor.toUpperCase()}! Better luck next time!`;
          this.showToast('🎡 Wrong color');
        }

        if (winnings > 0) {
          window.gameState.gold += winnings;
        // Sync currency to game after win
        if (typeof window.syncCurrencyToBag === 'function') {
            window.syncCurrencyToBag();
        }
          window.ArcadeGames.updateGoldDisplay();
          if (this.updateStats) this.updateStats();
        }

        document.getElementById('wheelResult').innerHTML = `<div class="${winnings > 0 ? 'win-message' : 'lose-message'}">${result}</div>`;

        spinBtn.disabled = false;
        spinBtn.style.opacity = '1';
      }, 2000);
    },

    // ========== HIGH-LOW CARD GAME ==========
    renderHighLowGame(display) {
      if (!this.state.highLowStreak) {
        this.state.highLowStreak = 0;
        this.state.highLowCurrentCard = this.getRandomCard();
      }

      display.innerHTML = `
        <div class="game-container highlow-game">
          <h3 class="game-title">🃏 HIGH-LOW CARD GAME</h3>

          <div class="game-display">
            <div class="card-display-area">
              <div class="card-label">CURRENT CARD</div>
              <div id="currentCardDisplay" class="card-display">${this.state.highLowCurrentCard.display}</div>
              <div class="card-value">Value: ${this.state.highLowCurrentCard.value}</div>
            </div>
            <div class="streak-display">🔥 Current Streak: <span id="streakDisplay">${this.state.highLowStreak}</span></div>
            <div id="highLowResult" class="game-result"></div>
          </div>

          <div class="betting-controls">
            <label>Bet Amount:</label>
            <div class="bet-buttons">
              ${window.ArcadeGames.getBetButtonsHTML('bet-btn-highlow')}
            </div>
            <div class="current-bet">Current Bet: <span id="highLowBetDisplay">1000</span> 💰</div>
          </div>

          <div class="highlow-actions">
            <button id="guessHighBtn" class="action-btn high-btn">⬆️ HIGHER</button>
            <button id="guessLowBtn" class="action-btn low-btn">⬇️ LOWER</button>
          </div>

          <div class="game-actions">
            <button id="cashOutBtn" class="action-btn cashout-btn">💰 CASH OUT (${this.state.highLowStreak}x)</button>
            <button id="backToArcadeBtn5" class="action-btn secondary">← Back</button>
          </div>

          <div class="game-rules">
            <h4>📋 Rules</h4>
            <p>✅ Guess if the next card is higher or lower</p>
            <p>🔥 Each correct guess adds 2x multiplier</p>
            <p>💰 Cash out anytime to secure your winnings</p>
            <p>❌ Wrong guess = Lose everything</p>
            <p>🎯 Aces can be high (14) or low (1)</p>
            <p style="color: #ffd77a;">Max: Streak 4 = 8x bet = 160K gold!</p>
          </div>
        </div>
      `;

      setTimeout(() => {
        window.ArcadeGames.setupBetButtons('.bet-btn-highlow', '#highLowBetDisplay', this);

        document.getElementById('guessHighBtn').addEventListener('click', () => this.playHighLow('high'));
        document.getElementById('guessLowBtn').addEventListener('click', () => this.playHighLow('low'));
        document.getElementById('cashOutBtn').addEventListener('click', () => this.cashOutHighLow());
        document.getElementById('backToArcadeBtn5').addEventListener('click', () => {
          this.state.highLowStreak = 0;
          const container = document.getElementById('map-subtab-content');
          if (container) this.renderArcadeSubtab(container);
        });
      }, 50);
    },

    getRandomCard() {
      const suits = ['♠️', '♥️', '♦️', '♣️'];
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const values = [14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

      const suit = suits[Math.floor(Math.random() * suits.length)];
      const rankIndex = Math.floor(Math.random() * ranks.length);
      const rank = ranks[rankIndex];
      const value = values[rankIndex];

      const color = (suit === '♥️' || suit === '♦️') ? 'red' : 'black';

      return {
        display: `<div style="color: ${color}">${rank}${suit}</div>`,
        value: value,
        rank: rank,
        suit: suit
      };
    },

    playHighLow(guess) {
      const bet = this.state.arcadeBet;

      if (this.state.highLowStreak === 0) {
        if (window.gameState.gold < bet) {
          this.showToast('❌ Not enough gold!');
          return;
        }
        window.gameState.gold -= bet;
      // Sync currency to game after bet
      if (typeof window.syncCurrencyToBag === 'function') {
          window.syncCurrencyToBag();
      }
        window.ArcadeGames.updateGoldDisplay();
        if (this.updateStats) this.updateStats();
      }

      const currentCard = this.state.highLowCurrentCard;
      const nextCard = this.getRandomCard();

      let correct = false;
      if (guess === 'high' && nextCard.value > currentCard.value) correct = true;
      if (guess === 'low' && nextCard.value < currentCard.value) correct = true;
      if (nextCard.value === currentCard.value) correct = true;

      const cardDisplay = document.getElementById('currentCardDisplay');
      cardDisplay.innerHTML = nextCard.display;

      const resultDiv = document.getElementById('highLowResult');

      if (correct) {
        this.state.highLowStreak++;
        this.state.highLowCurrentCard = nextCard;
        resultDiv.innerHTML = `<div class="win-message">✅ CORRECT! Streak: ${this.state.highLowStreak}x</div>`;
        document.getElementById('streakDisplay').textContent = this.state.highLowStreak;
        document.getElementById('cashOutBtn').textContent = `💰 CASH OUT (${Math.pow(2, this.state.highLowStreak)}x)`;
        this.showToast(`🃏 Correct! Streak ${this.state.highLowStreak}x`);
      } else {
        resultDiv.innerHTML = `<div class="lose-message">❌ WRONG! Streak lost!</div>`;
        this.showToast('🃏 Wrong guess - streak lost');
        this.state.highLowStreak = 0;
        this.state.highLowCurrentCard = this.getRandomCard();
        setTimeout(() => {
          this.renderHighLowGame(document.getElementById('arcade-game-display'));
        }, 2000);
      }
    },

    cashOutHighLow() {
      if (this.state.highLowStreak === 0) {
        this.showToast('❌ No winnings to cash out!');
        return;
      }

      const multiplier = Math.pow(2, this.state.highLowStreak);
      const winnings = this.state.arcadeBet * multiplier;

      window.gameState.gold += winnings;
      window.ArcadeGames.updateGoldDisplay();
      if (this.updateStats) this.updateStats();

      this.showToast(`🃏 Cashed out! +${winnings.toLocaleString()} gold`);

      this.state.highLowStreak = 0;
      this.state.highLowCurrentCard = this.getRandomCard();
      this.renderHighLowGame(document.getElementById('arcade-game-display'));
    }
  };

  console.log('[ArcadeGames] Games module loaded');
})();

/**
 * A1K ARCADE SYSTEM - CORE MODULE
 * Production-ready arcade betting system with 5 games
 * Version: 1.0.0
 *
 * INTEGRATION:
 * 1. Include arcade-core.js and arcade-games.js in your HTML
 * 2. Include arcade.css for styling
 * 3. Call window.ArcadeSystem.init(bagSystemInstance) after BagSystem is initialized
 * 4. Add 'arcade' subtab to your map tab rendering
 */

(function() {
  'use strict';

  // Arcade System Namespace
  window.ArcadeSystem = window.ArcadeSystem || {
    version: '1.0.0',
    initialized: false,
    bagSystem: null,

    /**
     * Initialize the Arcade System
     * @param {Object} bagSystem - The BagSystem instance to integrate with
     */
    init(bagSystem) {
      if (this.initialized) {
        console.warn('[ArcadeSystem] Already initialized');
        return;
      }

      if (!bagSystem) {
        console.error('[ArcadeSystem] BagSystem instance required');
        return;
      }

      this.bagSystem = bagSystem;

      // Initialize arcade state in bag system
      if (!bagSystem.state.arcadeGame) {
        bagSystem.state.arcadeGame = null;
        bagSystem.state.arcadeBet = 1000;
        bagSystem.state.wheelSelectedColor = null;
        bagSystem.state.highLowStreak = 0;
        bagSystem.state.highLowCurrentCard = null;
      }

      // Attach arcade methods to BagSystem
      this.attachMethods(bagSystem);

      this.initialized = true;
      console.log('[ArcadeSystem] ✅ Initialized successfully');
    },

    /**
     * Attach arcade methods to BagSystem instance
     */
    attachMethods(bagSystem) {
      // Main arcade rendering method
      bagSystem.renderArcadeSubtab = this.renderArcadeSubtab.bind(bagSystem);
      bagSystem.loadArcadeGame = this.loadArcadeGame.bind(bagSystem);

      // Game rendering methods
      bagSystem.renderSlotsGame = window.ArcadeGames?.renderSlotsGame.bind(bagSystem);
      bagSystem.renderRPSGame = window.ArcadeGames?.renderRPSGame.bind(bagSystem);
      bagSystem.renderDiceGame = window.ArcadeGames?.renderDiceGame.bind(bagSystem);
      bagSystem.renderWheelGame = window.ArcadeGames?.renderWheelGame.bind(bagSystem);
      bagSystem.renderHighLowGame = window.ArcadeGames?.renderHighLowGame.bind(bagSystem);

      // Game play methods
      bagSystem.playSlotsGame = window.ArcadeGames?.playSlotsGame.bind(bagSystem);
      bagSystem.playRPSGame = window.ArcadeGames?.playRPSGame.bind(bagSystem);
      bagSystem.playDiceGame = window.ArcadeGames?.playDiceGame.bind(bagSystem);
      bagSystem.playWheelGame = window.ArcadeGames?.playWheelGame.bind(bagSystem);
      bagSystem.playHighLow = window.ArcadeGames?.playHighLow.bind(bagSystem);
      bagSystem.cashOutHighLow = window.ArcadeGames?.cashOutHighLow.bind(bagSystem);
      bagSystem.getRandomCard = window.ArcadeGames?.getRandomCard.bind(bagSystem);
    },

    /**
     * Render the main arcade menu
     */
    renderArcadeSubtab(container) {
      // Initialize arcade state if needed
      if (!this.state.arcadeGame) {
        this.state.arcadeGame = null;
        this.state.arcadeBet = 1000;
      }

      const gold = (window.gameState?.gold || 0).toLocaleString();

      container.innerHTML = `
        <div class="arcade-container">
          <div class="arcade-header">
            <div class="arcade-title-icon">🎰</div>
            <h2 class="arcade-title">A1K ARCADE CASINO</h2>
            <p class="arcade-subtitle">Test your luck! Bet up to 20,000 gold and win up to 2,000,000!</p>
            <div class="arcade-gold-display">
              <span class="arcade-gold-label">💰 Your Gold: </span>
              <span class="arcade-gold-value" id="arcadeGoldDisplay">${gold}</span>
            </div>
          </div>

          <div class="arcade-games-grid">
            <button class="arcade-game-card" data-game="slots">
              <div class="game-icon">🎰</div>
              <h3 class="game-title">Slot Machine</h3>
              <p class="game-description">Classic 3-reel slots</p>
              <div class="game-max-win">Max Win: 2,000,000</div>
            </button>

            <button class="arcade-game-card" data-game="rps">
              <div class="game-icon">✊✋✌️</div>
              <h3 class="game-title">Rock Paper Scissors</h3>
              <p class="game-description">Beat the dealer!</p>
              <div class="game-max-win">Max Win: 40,000</div>
            </button>

            <button class="arcade-game-card" data-game="dice">
              <div class="game-icon">🎲</div>
              <h3 class="game-title">Dice Duel</h3>
              <p class="game-description">Roll higher to win!</p>
              <div class="game-max-win">Max Win: 60,000</div>
            </button>

            <button class="arcade-game-card" data-game="wheel">
              <div class="game-icon">🎡</div>
              <h3 class="game-title">Color Wheel</h3>
              <p class="game-description">Spin & bet on colors!</p>
              <div class="game-max-win">Max Win: 100,000</div>
            </button>

            <button class="arcade-game-card" data-game="highlow">
              <div class="game-icon">🃏</div>
              <h3 class="game-title">High-Low Card</h3>
              <p class="game-description">Guess higher or lower!</p>
              <div class="game-max-win">Max Win: 160,000</div>
            </button>
          </div>

          <div id="arcade-game-display" class="arcade-game-display"></div>
        </div>
      `;

      // Add hover effects and click handlers
      setTimeout(() => {
        const gameCards = container.querySelectorAll('.arcade-game-card');
        gameCards.forEach(card => {
          card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 30px rgba(255, 107, 53, 0.4)';
          });
          card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
          });
          card.addEventListener('click', (e) => {
            const game = e.currentTarget.dataset.game;
            this.loadArcadeGame(game);
          });
        });
      }, 50);
    },

    /**
     * Load a specific arcade game
     */
    loadArcadeGame(gameType) {
      this.state.arcadeGame = gameType;
      const display = document.getElementById('arcade-game-display');

      if (!display) {
        console.error('[ArcadeSystem] arcade-game-display not found');
        return;
      }

      switch(gameType) {
        case 'slots':
          this.renderSlotsGame(display);
          break;
        case 'rps':
          this.renderRPSGame(display);
          break;
        case 'dice':
          this.renderDiceGame(display);
          break;
        case 'wheel':
          this.renderWheelGame(display);
          break;
        case 'highlow':
          this.renderHighLowGame(display);
          break;
        default:
          console.error('[ArcadeSystem] Unknown game type:', gameType);
      }
    }
  };

  console.log('[ArcadeSystem] Core module loaded');
})();
