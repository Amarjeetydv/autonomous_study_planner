export interface GoalParserResult {
  subject?: string;
  subjectId?: string;
  topic?: string;
  duration?: number;
  confidence: number;
  isSpecific: boolean;
  suggestedTargetDate?: string; // YYYY-MM-DD
}

export interface SubjectMapping {
  subject: string;
  keywords: string[];
  topicsMap: { [keyword: string]: string };
}

export const SUBJECT_MAPPINGS: SubjectMapping[] = [
  {
    subject: 'Mathematics',
    keywords: [
      'probability',
      'calculus',
      'statistics',
      'linear algebra',
      'math',
      'mathematics',
      'discrete math',
      'differentiation',
      'integration',
      'matrix',
      'matrices',
      'algebra',
    ],
    topicsMap: {
      probability: 'Probability',
      statistics: 'Statistics',
      calculus: 'Calculus',
      differentiation: 'Differentiation',
      integration: 'Integration',
      'linear algebra': 'Linear Algebra',
      matrix: 'Linear Algebra & Matrices',
      matrices: 'Linear Algebra & Matrices',
      algebra: 'Algebra',
      math: 'Mathematics',
      mathematics: 'Mathematics',
    },
  },
  {
    subject: 'Database Management',
    keywords: [
      'dbms',
      'normalization',
      'sql',
      'transactions',
      'database',
      'relational database',
      'er diagram',
      'indexing',
      'nosql',
      'mongodb',
      'queries',
    ],
    topicsMap: {
      normalization: 'DBMS Normalization',
      sql: 'SQL Queries',
      transactions: 'Database Transactions',
      'er diagram': 'ER Diagram & Relational Schema',
      indexing: 'Database Indexing',
      mongodb: 'MongoDB & NoSQL',
      dbms: 'Database Management Systems',
      database: 'Database Management Systems',
    },
  },
  {
    subject: 'Data Structures & Algorithms',
    keywords: [
      'dsa',
      'binary tree',
      'binary trees',
      'tree',
      'graph',
      'dynamic programming',
      'dp',
      'sorting',
      'searching',
      'linked list',
      'stack',
      'queue',
      'heap',
      'algorithms',
      'data structures',
      'recursion',
    ],
    topicsMap: {
      'binary tree': 'Binary Trees',
      'binary trees': 'Binary Trees',
      tree: 'Tree Structures',
      graph: 'Graph Algorithms',
      'dynamic programming': 'Dynamic Programming',
      dp: 'Dynamic Programming',
      sorting: 'Sorting & Searching',
      'linked list': 'Linked Lists',
      stack: 'Stacks & Queues',
      heap: 'Heaps & Priority Queues',
      dsa: 'Data Structures & Algorithms',
    },
  },
  {
    subject: 'Web Development',
    keywords: [
      'react',
      'react hooks',
      'hooks',
      'node',
      'express',
      'javascript',
      'typescript',
      'web dev',
      'fullstack',
      'frontend',
      'backend',
      'html',
      'css',
      'api',
      'rest',
    ],
    topicsMap: {
      'react hooks': 'React Hooks',
      react: 'React',
      node: 'Node.js',
      express: 'Express.js & REST APIs',
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      fullstack: 'Fullstack Web Development',
      frontend: 'Frontend Development',
      backend: 'Backend API Engineering',
    },
  },
  {
    subject: 'Operating Systems',
    keywords: [
      'operating systems',
      'operating system',
      'os',
      'scheduling',
      'deadlock',
      'deadlocks',
      'process management',
      'memory management',
      'virtual memory',
      'paging',
      'threads',
      'semaphore',
    ],
    topicsMap: {
      scheduling: 'CPU Scheduling Algorithms',
      deadlock: 'Operating System Deadlocks',
      deadlocks: 'Operating System Deadlocks',
      'process management': 'Process Management',
      'virtual memory': 'Virtual Memory',
      paging: 'Memory Paging',
      threads: 'Multithreading & Concurrency',
      os: 'Operating Systems',
      'operating system': 'Operating Systems',
      'operating systems': 'Operating Systems',
    },
  },
  {
    subject: 'Computer Networks',
    keywords: [
      'computer networks',
      'networking',
      'tcp/ip',
      'tcp',
      'routing',
      'dns',
      'ip addressing',
      'osi model',
      'http',
      'https',
      'sockets',
    ],
    topicsMap: {
      'tcp/ip': 'TCP/IP Networking',
      routing: 'Network Routing',
      dns: 'DNS & Networking Protocols',
      'osi model': 'OSI Model Architecture',
      tcp: 'TCP Connection Control',
      networking: 'Computer Networks',
    },
  },
];

/**
 * Parses natural language goal input and returns subject, topic, duration, and confidence score.
 */
export function parseGoalInput(
  title: string,
  _availableSubjects: Array<{ id: string; name: string; code: string; category?: string }> = []
): GoalParserResult {
  if (!title || typeof title !== 'string' || !title.trim()) {
    return { confidence: 0, isSpecific: false };
  }

  const normalizedInput = title.toLowerCase().trim();

  // 1. Duration Extraction
  let duration: number | undefined;
  let suggestedTargetDate: string | undefined;

  const weekMatch = normalizedInput.match(/(\d+)\s*(week|weeks|wk|wks)/i);
  const dayMatch = normalizedInput.match(/(\d+)\s*(day|days|d)/i);
  const monthMatch = normalizedInput.match(/(\d+)\s*(month|months|mo)/i);

  if (weekMatch) {
    duration = parseInt(weekMatch[1], 10) * 7;
  } else if (dayMatch) {
    duration = parseInt(dayMatch[1], 10);
  } else if (monthMatch) {
    duration = parseInt(monthMatch[1], 10) * 30;
  }

  if (duration && duration > 0) {
    const target = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    suggestedTargetDate = target.toISOString().split('T')[0];
  }

  // 2. Exact match rules for standard learning paths
  if (normalizedInput.includes('permutation') || normalizedInput.includes('aptitude')) {
    return {
      subject: 'Aptitude',
      topic: 'Permutation & Combination',
      duration,
      confidence: 0.95,
      isSpecific: true,
      suggestedTargetDate
    };
  }

  if (normalizedInput.includes('react hooks') || normalizedInput.includes('react')) {
    return {
      subject: 'Web Development',
      topic: 'React Hooks',
      duration,
      confidence: 0.95,
      isSpecific: true,
      suggestedTargetDate
    };
  }

  if (normalizedInput.includes('dbms') || normalizedInput.includes('database')) {
    return {
      subject: 'Computer Science',
      topic: 'Database Management System',
      duration,
      confidence: 0.95,
      isSpecific: true,
      suggestedTargetDate
    };
  }

  if (normalizedInput.includes('upsc') || normalizedInput.includes('history')) {
    return {
      subject: 'UPSC',
      topic: 'History',
      duration,
      confidence: 0.95,
      isSpecific: true,
      suggestedTargetDate
    };
  }

  if (normalizedInput.includes('cat quant') || normalizedInput.includes('cat') || normalizedInput.includes('quant')) {
    return {
      subject: 'MBA Entrance',
      topic: 'Quantitative Aptitude',
      duration,
      confidence: 0.95,
      isSpecific: true,
      suggestedTargetDate
    };
  }

  // Fallback keyword mappings
  let bestMatchMapping: SubjectMapping | undefined;
  let matchedKeyword: string | undefined;
  let confidenceScore = 0.15;

  for (const mapping of SUBJECT_MAPPINGS) {
    for (const kw of mapping.keywords) {
      const pattern = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (pattern.test(normalizedInput)) {
        if (!bestMatchMapping) {
          bestMatchMapping = mapping;
          matchedKeyword = kw;
          confidenceScore = 0.90;
        }
      }
    }
  }

  const subjectName = bestMatchMapping ? bestMatchMapping.subject : 'Computer Science';
  const topicName = matchedKeyword && bestMatchMapping?.topicsMap[matchedKeyword]
    ? bestMatchMapping.topicsMap[matchedKeyword]
    : subjectName;

  const isSpecific = confidenceScore >= 0.75;

  return {
    subject: subjectName,
    topic: topicName,
    duration,
    confidence: confidenceScore,
    isSpecific,
    suggestedTargetDate
  };
}
