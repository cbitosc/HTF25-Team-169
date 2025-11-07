import admin from 'firebase-admin';
import { db } from './src/config/firebaseConfig.js';

const users = [
  {
    uid: 'user1',
    email: 'sarah.chen@example.com',
    displayName: 'Sarah Chen',
    skills: ['React', 'TypeScript', 'UI Design'],
    wantsToLearn: ['Python', 'Machine Learning'],
    rating: 4.8,
    bio: 'Full-stack developer passionate about creating beautiful interfaces',
  },
  {
    uid: 'user2',
    email: 'marcus.johnson@example.com',
    displayName: 'Marcus Johnson',
    skills: ['Python', 'Data Science', 'Machine Learning'],
    wantsToLearn: ['Web Development', 'React'],
    rating: 4.9,
    bio: 'Data scientist with 5+ years of experience',
    certifications: [],
    endorsements: [],
    feedbacks: []
  },
  {
    uid: 'user3',
    email: 'emma.rodriguez@example.com',
    displayName: 'Emma Rodriguez',
    skills: ['UI/UX Design', 'Figma', 'Product Strategy'],
    wantsToLearn: ['Frontend Development', 'JavaScript'],
    rating: 4.7,
    bio: 'Product designer focused on user-centered design',
    certifications: [],
    endorsements: [],
    feedbacks: []
  },
  {
    uid: 'user4',
    email: 'alex.kim@example.com',
    displayName: 'Alex Kim',
    skills: ['DevOps', 'Docker', 'Kubernetes'],
    wantsToLearn: ['System Design', 'Cloud Architecture'],
    rating: 4.6,
    bio: 'DevOps engineer with cloud infrastructure expertise',
    certifications: [],
    endorsements: [],
    feedbacks: []
  },
];

const skills = [
  'Python',
  'Machine Learning',
  'Web Design',
  'Data Analysis',
  'Cloud Computing',
  'Mobile Development',
  'Project Management',
  'Digital Marketing',
];

const sessions = [
    {
        student: 'user1',
        teacher: 'user2',
        skill: 'Python Basics',
        status: 'accepted',
        date: '2025-10-25',
    },
    {
        student: 'user3',
        teacher: 'user1',
        skill: 'React Advanced Patterns',
        status: 'pending',
        date: '2025-10-28',
    },
];

const seedDatabase = async () => {
  try {
    // Seed users
    for (const user of users) {
      const { certifications, endorsements, feedbacks, ...userData } = user;
      await db.collection('users').doc(user.uid).set(userData);

      for (const cert of certifications) {
        await db.collection('users').doc(user.uid).collection('certifications').add(cert);
      }

      for (const endorsement of endorsements) {
        await db.collection('users').doc(user.uid).collection('endorsements').add(endorsement);
      }

      for (const feedback of feedbacks) {
        await db.collection('users').doc(user.uid).collection('feedbacks').add(feedback);
      }
    }
    console.log('Successfully seeded users.');

    // Seed skills
    await db.collection('skills').doc('all').set({ list: skills });
    console.log('Successfully seeded skills.');

    // Seed sessions
    for (const session of sessions) {
        await db.collection('sessions').add(session);
    }
    console.log('Successfully seeded sessions.');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

seedDatabase();
