import { SchoolClass, Student } from '../models/class.model';
import { Resource } from '../models/resource.model';

export const MOCK_CLASSES: SchoolClass[] = [
  {
    id: 'cls-1',
    name: 'Class A',
    grade: '10th Grade',
    studentsCount: 28,
    teachers: ['Mr. Ahmed', 'Ms. Fatima'],
    resources: ['res-1', 'res-2']
  },
  {
    id: 'cls-2',
    name: 'Class B',
    grade: '10th Grade',
    studentsCount: 25,
    teachers: ['Mr. Youssef'],
    resources: ['res-3']
  },
  {
    id: 'cls-3',
    name: 'Class C',
    grade: '11th Grade',
    studentsCount: 30,
    teachers: ['Ms. Sara', 'Mr. Karim'],
    resources: ['res-1', 'res-4']
  },
  {
    id: 'cls-4',
    name: 'Class D',
    grade: '11th Grade',
    studentsCount: 22,
    teachers: ['Mr. Omar'],
    resources: ['res-5']
  },
  {
    id: 'cls-5',
    name: 'Class E',
    grade: '12th Grade',
    studentsCount: 27,
    teachers: ['Ms. Nadia', 'Mr. Ali'],
    resources: ['res-2', 'res-6']
  }
];

export const MOCK_STUDENTS: Student[] = [
  { id: 'stu-1', name: 'Amine Benali', email: 'amine@school.io', classId: 'cls-1' },
  { id: 'stu-2', name: 'Yasmine Khelil', email: 'yasmine@school.io', classId: 'cls-1' },
  { id: 'stu-3', name: 'Omar Tazi', email: 'omar@school.io', classId: 'cls-1' },
  { id: 'stu-4', name: 'Fatima Zahra', email: 'fatima@school.io', classId: 'cls-1' },
  { id: 'stu-5', name: 'Youssef Idrissi', email: 'youssef@school.io', classId: 'cls-1' },
  { id: 'stu-6', name: 'Salma Bourdi', email: 'salma@school.io', classId: 'cls-2' },
  { id: 'stu-7', name: 'Mehdi Fassi', email: 'mehdi@school.io', classId: 'cls-2' },
  { id: 'stu-8', name: 'Nour Alami', email: 'nour@school.io', classId: 'cls-2' },
  { id: 'stu-9', name: 'Hamza Chraibi', email: 'hamza@school.io', classId: 'cls-2' },
  { id: 'stu-10', name: 'Layla Bennani', email: 'layla@school.io', classId: 'cls-3' },
  { id: 'stu-11', name: 'Karim Saadi', email: 'karim@school.io', classId: 'cls-3' },
  { id: 'stu-12', name: 'Ines Mourad', email: 'ines@school.io', classId: 'cls-3' },
  { id: 'stu-13', name: 'Adam Ouazzani', email: 'adam@school.io', classId: 'cls-3' },
  { id: 'stu-14', name: 'Sara Lamrani', email: 'sara@school.io', classId: 'cls-4' },
  { id: 'stu-15', name: 'Bilal Hajji', email: 'bilal@school.io', classId: 'cls-4' },
  { id: 'stu-16', name: 'Rania Skali', email: 'rania@school.io', classId: 'cls-5' },
  { id: 'stu-17', name: 'Zakaria Amrani', email: 'zakaria@school.io', classId: 'cls-5' },
  { id: 'stu-18', name: 'Houda El Fassi', email: 'houda@school.io', classId: 'cls-5' }
];

export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'res-1',
    title: 'School Policy Handbook 2026',
    type: 'official',
    description: 'Official school policies and guidelines for the academic year 2026.',
    uploadedBy: 'Admin',
    date: '2026-01-15',
    classId: 'cls-1'
  },
  {
    id: 'res-2',
    title: 'Attendance Report Template',
    type: 'official',
    description: 'Standard template for monthly attendance reports.',
    uploadedBy: 'Admin',
    date: '2026-01-20'
  },
  {
    id: 'res-3',
    title: 'Math Curriculum Guide',
    type: 'non-official',
    description: 'Supplementary math curriculum guide for Class B.',
    uploadedBy: 'Mr. Youssef',
    date: '2026-02-05',
    classId: 'cls-2'
  },
  {
    id: 'res-4',
    title: 'Student Code of Conduct',
    type: 'official',
    description: 'Official student code of conduct and disciplinary procedures.',
    uploadedBy: 'Admin',
    date: '2026-01-10'
  },
  {
    id: 'res-5',
    title: 'Science Lab Safety Rules',
    type: 'official',
    description: 'Official safety rules and procedures for laboratory sessions.',
    uploadedBy: 'Ms. Nadia',
    date: '2026-02-12',
    classId: 'cls-4'
  },
  {
    id: 'res-6',
    title: 'History Study Notes',
    type: 'non-official',
    description: 'Teacher-prepared study notes for history module.',
    uploadedBy: 'Mr. Ali',
    date: '2026-02-18',
    classId: 'cls-5'
  },
  {
    id: 'res-7',
    title: 'Exam Schedule Spring 2026',
    type: 'official',
    description: 'Official examination schedule for spring semester.',
    uploadedBy: 'Admin',
    date: '2026-02-25'
  },
  {
    id: 'res-8',
    title: 'French Literature Anthology',
    type: 'non-official',
    description: 'Compiled readings for advanced French literature class.',
    uploadedBy: 'Ms. Sara',
    date: '2026-01-30',
    classId: 'cls-3'
  }
];
