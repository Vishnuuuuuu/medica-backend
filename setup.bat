@echo off
echo 🏥 Healthcare Shift Logging Backend Setup
echo =========================================

REM Check if .env file exists
if not exist .env (
    echo 📋 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please update .env file with your actual configuration values
) else (
    echo ✅ .env file already exists
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Generate Prisma client
echo 🔧 Generating Prisma client...
npx prisma generate

echo.
echo 🎉 Setup completed!
echo.
echo Next steps:
echo 1. Update your .env file with real configuration values
echo 2. Set up your PostgreSQL database
echo 3. Configure your Auth0 application
echo 4. Run 'npm run db:push' to sync your database schema
echo 5. Run 'npm run db:seed' to add sample data
echo 6. Run 'npm run dev' to start the development server
echo.
echo Happy coding! 🚀
pause
