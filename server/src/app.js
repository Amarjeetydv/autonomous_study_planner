const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const notFoundMiddleware = require('./middlewares/notFound.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'https://autonomous-study-planner-client.vercel.app',
  'https://autonomous-study-planner.vercel.app',
]);

if (env.corsOrigin && env.corsOrigin !== '*') {
  env.corsOrigin.split(',').forEach((o) => {
    const trimmed = o.trim();
    if (trimmed) {
      allowedOrigins.add(trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed);
    }
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    if (env.corsOrigin === '*' || allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy error: Origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200,
};

// Security and platform middleware should be registered before routes.
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    limit: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

app.use(routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
