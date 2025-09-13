#include <iostream>
#include <cstdint>
#include <limits>
#include <cmath>

// Compute factorial (returns 0 on overflow)
uint64_t factorial(unsigned int n) {
	if (n == 0 || n == 1) return 1;
	uint64_t result = 1;
	for (unsigned int i = 2; i <= n; ++i) {
		if (result > std::numeric_limits<uint64_t>::max() / i) {
			return 0; // indicate overflow
		}
		result *= i;
	}
	return result;
}

// Simple primality check for small n
bool isPrime(uint64_t n) {
	if (n < 2) return false;
	if (n % 2 == 0) return n == 2;
	uint64_t r = static_cast<uint64_t>(std::sqrt((double)n));
	for (uint64_t i = 3; i <= r; i += 2) {
		if (n % i == 0) return false;
	}
	return true;
}

int main() {
	std::cout << "Enter a non-negative integer: ";
	unsigned long long input;
	if (!(std::cin >> input)) {
		std::cerr << "Invalid input\n";
		return 1;
	}
	if (input > 20) {
		// factorial beyond 20 may overflow uint64_t (20! fits in 64-bit)
		std::cout << "Warning: factorial may overflow uint64_t for values > 20\n";
	}
	uint64_t fact = factorial(static_cast<unsigned int>(input));
	if (fact == 0) {
		std::cout << "Factorial overflowed for " << input << "\n";
	} else {
		std::cout << input << "! = " << fact << "\n";
	}
	std::cout << input << (isPrime(input) ? " is prime\n" : " is not prime\n");
	return 0;
}

// Compile/run note:
// g++ -o factorial_prime factorial_prime.cpp -lm
// ./factorial_prime