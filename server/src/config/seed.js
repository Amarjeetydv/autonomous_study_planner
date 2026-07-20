const mongoose = require('mongoose');
const env = require('./env');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Subtopic = require('../models/Subtopic');

const mockSubjects = [
  {
    name: 'Mathematics',
    code: 'MATH101',
    category: 'STEM',
    description: 'Foundational concepts in algebra, calculus, and linear algebra.',
    difficulty: 'medium',
    color: '#3b82f6',
    estimatedHours: 40,
    topics: [
      {
        name: 'Linear Algebra',
        description: 'Matrices, vectors, vector spaces, and linear transformations.',
        difficulty: 'medium',
        order: 1,
        estimatedTimeMinutes: 600,
        subtopics: [
          {
            name: 'Matrix Operations',
            description: 'Addition, multiplication, and transposition of matrices.',
            learningObjective: 'Understand how to multiply matrices and calculate determinants.',
            order: 1,
            estimatedTimeMinutes: 120,
          },
          {
            name: 'Eigenvalues and Eigenvectors',
            description: 'Solving characteristic equations and diagonalization.',
            learningObjective: 'Compute eigenvalues and apply diagonalization.',
            order: 2,
            estimatedTimeMinutes: 180,
          }
        ]
      },
      {
        name: 'Calculus',
        description: 'Limits, derivatives, and integral calculus.',
        difficulty: 'hard',
        order: 2,
        estimatedTimeMinutes: 900,
        subtopics: [
          {
            name: 'Differentiation Basics',
            description: 'Introduction to rates of change and limits.',
            learningObjective: 'Calculate derivatives of basic functions.',
            order: 1,
            estimatedTimeMinutes: 120,
          },
          {
            name: 'Definite Integrals',
            description: 'Finding area under the curve and Riemann sums.',
            learningObjective: 'Evaluate definite integrals using the Fundamental Theorem of Calculus.',
            order: 2,
            estimatedTimeMinutes: 180,
          }
        ]
      }
    ]
  },
  {
    name: 'Artificial Intelligence',
    code: 'AI201',
    category: 'Computer Science',
    description: 'Core machine learning models, search algorithms, and agent design.',
    difficulty: 'hard',
    color: '#8b5cf6',
    estimatedHours: 50,
    topics: [
      {
        name: 'Search Algorithms',
        description: 'Breadth-first search, depth-first search, and A* search.',
        difficulty: 'medium',
        order: 1,
        estimatedTimeMinutes: 400,
        subtopics: [
          {
            name: 'Uninformed Search',
            description: 'BFS, DFS, and Uniform Cost Search concepts.',
            learningObjective: 'Understand time and space complexity of BFS/DFS.',
            order: 1,
            estimatedTimeMinutes: 120,
          },
          {
            name: 'Heuristic Search',
            description: 'A* search and Greedy best-first search.',
            learningObjective: 'Design heuristics for pathfinding algorithms.',
            order: 2,
            estimatedTimeMinutes: 150,
          }
        ]
      },
      {
        name: 'Supervised Learning',
        description: 'Regression and classification techniques.',
        difficulty: 'hard',
        order: 2,
        estimatedTimeMinutes: 700,
        subtopics: [
          {
            name: 'Linear Regression',
            description: 'Ordinary least squares and gradient descent.',
            learningObjective: 'Understand cost functions and parameters optimization.',
            order: 1,
            estimatedTimeMinutes: 120,
          },
          {
            name: 'Decision Trees',
            description: 'Entropy, information gain, and tree pruning.',
            learningObjective: 'Construct and trace a simple decision tree model.',
            order: 2,
            estimatedTimeMinutes: 180,
          }
        ]
      }
    ]
  },
  {
    name: 'Web Development',
    code: 'WEB101',
    category: 'Computer Science',
    description: 'Frontend, backend, React hooks, APIs, and modern web architectures.',
    difficulty: 'medium',
    color: '#10b981',
    estimatedHours: 45,
    topics: [
      {
        name: 'React Hooks',
        description: 'useState, useEffect, useMemo, useCallback, and custom hooks.',
        difficulty: 'medium',
        order: 1,
        estimatedTimeMinutes: 500,
        subtopics: [
          {
            name: 'State & Effects',
            description: 'Managing component state and side effects.',
            learningObjective: 'Master state management with React Hooks.',
            order: 1,
            estimatedTimeMinutes: 180,
          }
        ]
      }
    ]
  }
];

const seedDB = async () => {
  try {
    const dbUri = env.mongoUri || 'mongodb://localhost:27017/autonomous-study-planner';
    console.log('Connecting to database:', dbUri);
    await mongoose.connect(dbUri);
    console.log('Connected to database successfully!');

    console.log('Clearing old subjects, topics, and subtopics...');
    await Promise.all([
      Subject.deleteMany({}),
      Topic.deleteMany({}),
      Subtopic.deleteMany({}),
    ]);
    console.log('Database collections cleared.');

    for (const sub of mockSubjects) {
      const subject = await Subject.create({
        name: sub.name,
        code: sub.code,
        category: sub.category,
        description: sub.description,
        difficulty: sub.difficulty,
        color: sub.color,
        estimatedHours: sub.estimatedHours,
      });

      console.log(`Seeding subject: ${subject.name} (${subject.code})`);

      for (const t of sub.topics) {
        const topic = await Topic.create({
          subjectId: subject._id,
          name: t.name,
          description: t.description,
          difficulty: t.difficulty,
          order: t.order,
          estimatedTimeMinutes: t.estimatedTimeMinutes,
        });

        for (const s of t.subtopics) {
          await Subtopic.create({
            topicId: topic._id,
            name: s.name,
            description: s.description,
            learningObjective: s.learningObjective,
            order: s.order,
            estimatedTimeMinutes: s.estimatedTimeMinutes,
          });
        }
      }
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
