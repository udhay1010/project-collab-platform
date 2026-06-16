const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const seedDB = async () => {
  try {
    const User = require('../models/User');
    const Project = require('../models/Project');

    const projectCount = await Project.countDocuments();
    if (projectCount > 0) {
      console.log('Database already has projects, skipping seed.');
      return;
    }

    console.log('Seeding mock data for development...');
    
    // Clear any existing users/projects to avoid duplicates
    await User.deleteMany({});
    await Project.deleteMany({});

    // 1. Create mock creators
    const user1 = await User.create({
      name: 'Alex Rivera',
      email: 'alex@buildmate.com',
      password: 'Password123',
      bio: 'Fullstack developer interested in React and Node.',
      skills: ['React', 'Node.js', 'Database']
    });

    const user2 = await User.create({
      name: 'Sophia Chen',
      email: 'sophia@buildmate.com',
      password: 'Password123',
      bio: 'UI/UX designer. Figma enthusiast.',
      skills: ['UI/UX', 'Figma']
    });

    const user3 = await User.create({
      name: 'Liam Johnson',
      email: 'liam@buildmate.com',
      password: 'Password123',
      bio: 'Data scientist. Loves Python and Machine Learning.',
      skills: ['Python', 'Machine Learning']
    });

    const user4 = await User.create({
      name: 'Emma Watson',
      email: 'emma@buildmate.com',
      password: 'Password123',
      bio: 'Frontend engineer. Works with Vue and TypeScript.',
      skills: ['Vue', 'TypeScript', 'React']
    });

    // 2. Create 10 projects
    const mockProjects = [
      {
        title: 'AI Chrome Extension',
        description: 'A smart Chrome extension powered by Gemini that summarizes web articles on the fly and highlights key takeaways.',
        skillsNeeded: ['React', 'TypeScript', 'Machine Learning'],
        creator: user1._id,
        maxTeamSize: 4
      },
      {
        title: 'Task Planner & Tracker',
        description: 'A beautiful, premium task planner with drag-and-drop support, subtasks, and real-time collaboration features.',
        skillsNeeded: ['React', 'Database', 'Node.js'],
        creator: user4._id,
        maxTeamSize: 3
      },
      {
        title: 'Portfolio Builder for Designers',
        description: 'A drag-and-drop tool tailored for designers to showcase their UX case studies and Figma portfolios easily.',
        skillsNeeded: ['Figma', 'UI/UX', 'React'],
        creator: user2._id,
        maxTeamSize: 2
      },
      {
        title: 'Personal Finance Dashboard',
        description: 'An application to help students track their monthly expenses, visualize spending categories, and set budgets.',
        skillsNeeded: ['React', 'Python', 'Database'],
        creator: user3._id,
        maxTeamSize: 4
      },
      {
        title: 'Decentralized Chat Application',
        description: 'A secure, end-to-end encrypted chat application that runs entirely on decentralized peer-to-peer networks.',
        skillsNeeded: ['Node.js', 'Database'],
        creator: user1._id,
        maxTeamSize: 5
      },
      {
        title: 'Interactive Code Learning Hub',
        description: 'A gamified platform where users can solve short coding puzzles in Python, Javascript, and Vue, and earn badges.',
        skillsNeeded: ['Python', 'Vue', 'Node.js'],
        creator: user4._id,
        maxTeamSize: 4
      },
      {
        title: 'Smart Resume Analyzer',
        description: 'An AI-powered web tool that scans resumes against job descriptions, suggesting improvements for keywords.',
        skillsNeeded: ['Python', 'Machine Learning', 'UI/UX'],
        creator: user3._id,
        maxTeamSize: 3
      },
      {
        title: 'Recipe & Meal Planner App',
        description: 'A cross-platform mobile application where users can discover new recipes based on available ingredients.',
        skillsNeeded: ['Flutter', 'Database'],
        creator: user2._id,
        maxTeamSize: 3
      },
      {
        title: 'DevOps Analytics Dashboard',
        description: 'A real-time telemetry dashboard showing server resource usage, build states, and deployment metrics.',
        skillsNeeded: ['Vue', 'TypeScript', 'Node.js'],
        creator: user1._id,
        maxTeamSize: 4
      },
      {
        title: 'E-Commerce Mock Platform',
        description: 'A lightweight online storefront built to demonstrate complex state management, payment mockups, and checkout flows.',
        skillsNeeded: ['React', 'Database'],
        creator: user4._id,
        maxTeamSize: 5
      }
    ];

    await Project.insertMany(mockProjects);
    console.log('Seeded 10 mock projects successfully!');
  } catch (error) {
    console.error(`Failed to seed database: ${error.message}`);
  }
};

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/buildmate';

    // If using a local address, try connecting first. If it fails, spin up in-memory Mongo.
    if (mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')) {
      try {
        console.log('Attempting to connect to local MongoDB database...');
        const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
        console.log(`MongoDB connected locally: ${conn.connection.host}`);
        await seedDB();
        return;
      } catch (err) {
        console.log('Local MongoDB not detected. Starting in-memory MongoDB server instead...');
        mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        console.log(`In-memory MongoDB started at: ${mongoUri}`);
      }
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    await seedDB();
  } catch (err) {
    console.error(`DB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

