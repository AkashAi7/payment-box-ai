# Contributing to Payment Box AI

Thank you for your interest in contributing to Payment Box AI! We welcome contributions from the community.

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request:

1. Check if the issue already exists in the GitHub Issues
2. If not, create a new issue with a clear title and description
3. Include steps to reproduce (for bugs)
4. Include your environment details (OS, Node.js version, etc.)

### Submitting Pull Requests

1. Fork the repository
2. Create a new branch for your feature (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests as needed
5. Ensure all tests pass (`npm test`)
6. Run the linter (`npm run lint`)
7. Commit your changes with a descriptive message
8. Push to your fork
9. Open a Pull Request

### Code Style

- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Write tests for new features

### Commit Messages

- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Keep the first line under 72 characters
- Add detailed description if needed

### Testing

- Write tests for all new features
- Ensure existing tests still pass
- Aim for high test coverage
- Test both success and error cases

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/payment-box-ai.git
cd payment-box-ai

# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint

# Start development server
npm run dev
```

## Project Structure

```
payment-box-ai/
├── src/
│   ├── SandboxManager.js      # Core sandbox management
│   ├── BiometricAuth.js        # Authentication handling
│   ├── server.js               # Express API server
│   ├── index.js                # Main entry point
│   └── __tests__/              # Test files
├── public/
│   └── index.html              # Web interface
├── examples/                   # Usage examples
├── README.md                   # Main documentation
└── package.json                # Dependencies
```

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

## Questions?

If you have questions about contributing, feel free to open an issue or reach out to the maintainers.

Thank you for contributing to Payment Box AI! 🚀
