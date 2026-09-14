# Contributing to BookBridgee

Thanks for helping improve BookBridgee.

## Before you start

1. Search existing issues before opening a new one.
2. For a substantial feature, open an issue first so the approach can be discussed.
3. Never commit credentials, local databases, uploaded media, or generated cache files.

## Development workflow

1. Fork the repository and create a focused branch from `main`.
2. Make the smallest change that solves the problem.
3. Run the quality checks:

   ```bash
   python backend/manage.py check
   python backend/manage.py test
   ```

4. Use clear commit messages, for example `feat: add listing validation` or `fix: protect admin statistics endpoint`.
5. Open a pull request explaining what changed, why it changed, and how it was tested.

## Code guidelines

- Use Django and Django REST Framework for backend behaviour.
- Keep MySQL as the production database.
- Preserve accessible, responsive frontend behaviour.
- Add or update tests whenever backend behaviour changes.
- Do not introduce fake success states for unavailable backend services.
