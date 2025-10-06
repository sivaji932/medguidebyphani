from app import app

# This is the WSGI callable that Vercel will use
application = app

if __name__ == "__main__":
    app.run()