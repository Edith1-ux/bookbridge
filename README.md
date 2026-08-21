# BookBridge 📚

> A student marketplace for buying, selling, exchanging, and donating academic books.

[![Django checks](https://github.com/Edith1-ux/book-bridge-2/actions/workflows/django-checks.yml/badge.svg)](https://github.com/Edith1-ux/book-bridge-2/actions/workflows/django-checks.yml)

BookBridge helps students make textbooks and academic resources more affordable, accessible, and sustainable. Students can discover books by department, semester, subject, or condition; list books they no longer need; propose exchanges; and claim donated books.

![BookBridge preview](browse_images/hero.png)

## Features

- Browse and filter academic books
- Student registration and JWT authentication
- Buy, sell, exchange, and donate listing modes
- Wishlist, exchange proposal, donation claim, and messaging foundations
- Responsive HTML, CSS, and vanilla JavaScript interface
- Django REST API backed by MySQL

> Some integrations, including payments and AI assistance, are still under active development. See [the roadmap](#roadmap).

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Python, Django, Django REST Framework |
| Database | MySQL |
| Authentication | JWT via Simple JWT |
| Deployment | Docker-compatible platform such as Railway |

## Quick start

### Requirements

- Python 3.11 or newer
- MySQL 8 or newer
- Git

### Installation

```bash
git clone https://github.com/Edith1-ux/book-bridge-2.git
cd book-bridge-2
python -m venv .venv
```

Activate the virtual environment, then install dependencies:

```bash
pip install -r backend/requirements.txt
```

Copy `.env.example` to `.env` and update the MySQL credentials. Keep `.env` private.

```bash
python backend/manage.py migrate
python backend/manage.py seed_db
python backend/manage.py runserver
```

Open `http://127.0.0.1:8000` in your browser.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `SECRET_KEY` | Django application secret; use a unique strong value in production |
| `DEBUG` | Set to `False` in production |
| `ALLOWED_HOSTS` | Comma-separated permitted hostnames |
| `MYSQL_HOST` | MySQL host |
| `MYSQL_PORT` | MySQL port, usually `3306` |
| `MYSQL_DATABASE` | Database name |
| `MYSQL_USER` | Database user |
| `MYSQL_PASSWORD` | Database password |

## Project structure

```text
book-bridge-2/
├── backend/             # Django project, apps, REST API, and migrations
├── css/                 # Shared frontend styles
├── js/                  # Frontend behaviour and API client
├── browse_images/       # Website imagery
├── .github/             # CI and GitHub issue templates
├── Dockerfile
├── .env.example
└── README.md
```

## Quality checks

```bash
python backend/manage.py check
python backend/manage.py test
```

GitHub Actions runs these checks on pushes and pull requests to `main`.

## Roadmap

- [x] Browse and filter book listings
- [x] Basic student authentication and listing models
- [ ] Complete secure listing-creation workflow
- [ ] Production MySQL deployment
- [ ] Admin moderation and reporting
- [ ] Email verification and password recovery email
- [ ] Real payment integration or clear offline-payment flow
- [ ] Broader automated test coverage

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.

## Security

Please report security vulnerabilities privately as described in [SECURITY.md](SECURITY.md). Do not post sensitive vulnerabilities in public issues.

## License

This project is available under the [MIT License](LICENSE).
