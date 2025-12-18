# Contributing to Blockchain Voting System

First off, thank you for considering contributing to the Blockchain Voting System! 🎉

It's people like you that make this project a great tool for learning and building decentralized voting systems.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (OS, Node version, network)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear use case** for the feature
- **Expected behavior** with examples
- **Alternative solutions** you've considered
- **Impact** on existing functionality

### Code Contributions

We welcome contributions in these areas:

- 🔧 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations
- 🧪 Test coverage improvements
- 🔐 Security enhancements

## Development Setup

1. **Fork and clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/blockchain-voting.git
cd blockchain-voting
```

2. **Install dependencies**
```bash
npm install
```

3. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

4. **Set up environment**
```bash
cp .env.example .env
# Add your configuration
```

5. **Run tests**
```bash
npm test
```

## Pull Request Process

1. **Update documentation** for any changed functionality
2. **Add tests** for new features
3. **Ensure all tests pass**
```bash
npm test
npm run lint
```
4. **Update the README.md** with details of changes if needed
5. **Follow commit message conventions**:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `test:` for tests
   - `refactor:` for code refactoring
   - `chore:` for maintenance tasks

6. **Submit the PR** with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots/videos for UI changes

### PR Review Process

- Maintainers will review within 48-72 hours
- Address review comments promptly
- Keep commits clean and squash if needed
- Be patient and respectful

## Style Guidelines

### Solidity Code

- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use meaningful variable and function names
- Add NatSpec comments for public functions
- Keep functions small and focused
- Prefer explicit over implicit

```solidity
/// @notice Registers a new voter for an election
/// @param _electionId The ID of the election
/// @return success True if registration succeeded
function registerVoter(uint256 _electionId) external returns (bool success) {
    // Implementation
}
```

### JavaScript/TypeScript

- Use ES6+ features
- Follow consistent indentation (2 spaces)
- Use descriptive variable names
- Add JSDoc comments for complex functions

### Python Code

- Follow PEP 8 style guide
- Use type hints where applicable
- Add docstrings for classes and functions
- Keep functions focused and modular

### Git Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and PRs when relevant

```
feat: Add delegate voting functionality

- Implement delegateVote function in smart contract
- Add delegation tracking in state variables
- Update tests to cover delegation scenarios
- Add documentation for delegation feature

Resolves #123
```

## Testing Guidelines

- Write tests for all new features
- Ensure edge cases are covered
- Aim for >80% code coverage
- Use descriptive test names

```javascript
describe("VotingSystem", function() {
  it("should prevent double voting in the same election", async function() {
    // Test implementation
  });
});
```

## Documentation

- Update README.md for user-facing changes
- Add inline comments for complex logic
- Create ADRs (Architecture Decision Records) for major changes
- Update API documentation

## Community

- 💬 [GitHub Discussions](https://github.com/chetx27/blockchain-voting/discussions) - Ask questions and share ideas
- 🐛 [GitHub Issues](https://github.com/chetx27/blockchain-voting/issues) - Report bugs and request features
- ⭐ Star the repo if you find it useful!

## Recognition

All contributors will be recognized in our README.md. We value every contribution, no matter how small!

## Questions?

Don't hesitate to ask questions in [Discussions](https://github.com/chetx27/blockchain-voting/discussions) or open an issue.

Thank you for contributing! 🚀