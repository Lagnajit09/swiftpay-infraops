# payment-service

Express.js TypeScript Server

## Features

- ✅ Express.js server
- ✅ CORS enabled
- ✅ Environment variables support
- ✅ TypeScript configured
- ✅ Prisma integration
- ✅ Health check endpoint

## Getting Started

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and update the values:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=your_database_url
```

### Prisma Setup

```bash
npm run prisma:generate
npm run prisma:migrate
```


### Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on http://localhost:3000

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check

## Project Structure

```
payment-service/
├── src/
│   └── index.ts    # Main application file
├── dist/              # Compiled JavaScript (generated)
├── prisma/
│   └── schema.prisma # Prisma schema
├── .env              # Environment variables
├── .gitignore        # Git ignore rules
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── README.md         # This file
```

## Package Manager

This project uses **npm**. 



## Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm run build` - Compile TypeScript to JavaScript
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations


## License

MIT
