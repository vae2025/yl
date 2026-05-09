import { randomUUID } from 'node:crypto'

export type LanguageCode = 'en' | 'ja' | 'ko'

export type User = {
  id: string
  email: string
  username: string
  passwordHash: string
  passwordSalt: string
  createdAt: string
}

export type Session = {
  token: string
  userId: string
  expiresAt: string
}

export type Preference = {
  userId: string
  language: LanguageCode
  level: 'A1' | 'A2' | 'B1'
  dailyMinutes: number
  updatedAt: string
}

export type Course = {
  id: string
  language: LanguageCode
  level: string
  title: string
  description: string
}

export type Lesson = {
  id: string
  courseId: string
  unit: number
  title: string
  contentType: 'dialogue' | 'article'
  lines: { speaker?: string; text: string }[]
  vocab: { term: string; reading?: string; meaning: string }[]
  grammar: { title: string; explanation: string; examples: string[] }[]
}

export type ActivityDay = {
  userId: string
  date: string
  minutes: number
  correct: number
  total: number
}

export type LessonProgress = {
  userId: string
  lessonId: string
  completion: number
  updatedAt: string
}

export type Post = {
  id: string
  authorId: string
  title: string
  content: string
  createdAt: string
  likeCount: number
  commentCount: number
}

export type Achievement = {
  id: string
  name: string
  description: string
}

export type UserAchievement = {
  userId: string
  achievementId: string
  earnedAt: string
}

export type Db = {
  users: User[]
  sessions: Session[]
  preferences: Preference[]
  courses: Course[]
  lessons: Lesson[]
  activity: ActivityDay[]
  lessonProgress: LessonProgress[]
  posts: Post[]
  achievements: Achievement[]
  userAchievements: UserAchievement[]
}

function nowIso() {
  return new Date().toISOString()
}

export function createSeedDb(): Db {
  const enCourseId = randomUUID()
  const jaCourseId = randomUUID()
  const koCourseId = randomUUID()

  const courses: Course[] = [
    {
      id: enCourseId,
      language: 'en',
      level: 'A1',
      title: '英语 A1｜日常开场白',
      description: '从招呼、自我介绍到点单，建立最常用的口语骨架。',
    },
    {
      id: jaCourseId,
      language: 'ja',
      level: 'A1',
      title: '日语 A1｜便利店与问路',
      description: '用最短句子完成购买、询问与基本应答。',
    },
    {
      id: koCourseId,
      language: 'ko',
      level: 'A1',
      title: '韩语 A1｜第一次见面',
      description: '自我介绍、礼貌表达与基本句型练习。',
    },
  ]

  const lessons: Lesson[] = [
    {
      id: randomUUID(),
      courseId: enCourseId,
      unit: 1,
      title: 'Hello & Nice to meet you',
      contentType: 'dialogue',
      lines: [
        { speaker: 'A', text: 'Hi! I’m Alex. Nice to meet you.' },
        { speaker: 'B', text: 'Nice to meet you too. I’m Mina.' },
        { speaker: 'A', text: 'Where are you from?' },
        { speaker: 'B', text: 'I’m from Seoul.' },
      ],
      vocab: [
        { term: 'nice to meet you', meaning: '很高兴认识你' },
        { term: 'where are you from', meaning: '你来自哪里' },
      ],
      grammar: [
        {
          title: 'I’m + 名字/身份',
          explanation: '用 I’m（= I am）做自我介绍，语气自然。',
          examples: ['I’m Alex.', 'I’m a student.'],
        },
      ],
    },
    {
      id: randomUUID(),
      courseId: enCourseId,
      unit: 2,
      title: 'Ordering coffee',
      contentType: 'dialogue',
      lines: [
        { speaker: 'You', text: 'Can I get a latte, please?' },
        { speaker: 'Barista', text: 'Sure. Medium or large?' },
        { speaker: 'You', text: 'Medium, please.' },
      ],
      vocab: [
        { term: 'Can I get…?', meaning: '我可以要/点…吗？' },
        { term: 'medium', meaning: '中杯/中号' },
        { term: 'large', meaning: '大杯/大号' },
      ],
      grammar: [
        {
          title: 'Can I get…?（礼貌点单）',
          explanation: '比 Give me… 更礼貌，适合点餐点饮料。',
          examples: ['Can I get a latte?', 'Can I get two sandwiches?'],
        },
      ],
    },
    {
      id: randomUUID(),
      courseId: enCourseId,
      unit: 3,
      title: 'Small talk starter',
      contentType: 'article',
      lines: [
        { text: 'A simple way to start small talk is to ask about the day.' },
        { text: 'Try: “How’s your day going?” and follow up with “That sounds great.”' },
      ],
      vocab: [
        { term: 'small talk', meaning: '寒暄/闲聊' },
        { term: 'follow up', meaning: '接着问/补充追问' },
      ],
      grammar: [
        {
          title: 'How’s … going?',
          explanation: '询问进展/状态的固定表达，语气随和。',
          examples: ["How's it going?", "How's your week going?"],
        },
      ],
    },
    {
      id: randomUUID(),
      courseId: jaCourseId,
      unit: 1,
      title: 'こんにちは｜あいさつ',
      contentType: 'dialogue',
      lines: [
        { speaker: 'A', text: 'こんにちは。はじめまして。' },
        { speaker: 'B', text: 'はじめまして。よろしくお願いします。' },
      ],
      vocab: [
        { term: 'こんにちは', reading: 'konnichiwa', meaning: '你好/下午好' },
        { term: 'はじめまして', reading: 'hajimemashite', meaning: '初次见面' },
        { term: 'よろしくお願いします', reading: 'yoroshiku onegaishimasu', meaning: '请多关照' },
      ],
      grammar: [
        {
          title: 'よろしくお願いします（固定表达）',
          explanation: '初次见面常用套语，礼貌自然。',
          examples: ['はじめまして。よろしくお願いします。'],
        },
      ],
    },
    {
      id: randomUUID(),
      courseId: koCourseId,
      unit: 1,
      title: '안녕하세요｜자기소개',
      contentType: 'dialogue',
      lines: [
        { speaker: 'A', text: '안녕하세요. 저는 민지예요.' },
        { speaker: 'B', text: '안녕하세요. 만나서 반가워요.' },
      ],
      vocab: [
        { term: '안녕하세요', reading: 'annyeonghaseyo', meaning: '你好' },
        { term: '저는 …예요', reading: 'jeoneun …yeyo', meaning: '我是…' },
        { term: '반가워요', reading: 'bangawoyo', meaning: '很高兴见到你' },
      ],
      grammar: [
        {
          title: '저는 …예요/이에요',
          explanation: '自我介绍常用句型，…后接名字或身份。',
          examples: ['저는 민지예요.', '저는 학생이에요.'],
        },
      ],
    },
  ]

  const achievements: Achievement[] = [
    {
      id: 'first_lesson',
      name: '第一课完成',
      description: '完成任意一节课时学习。',
    },
    {
      id: 'first_post',
      name: '第一次发帖',
      description: '在社区发布第一条帖子。',
    },
    {
      id: 'streak_3',
      name: '连续 3 天',
      description: '连续学习 3 天（任意时长）。',
    },
  ]

  const posts: Post[] = [
    {
      id: randomUUID(),
      authorId: 'seed',
      title: '欢迎来到 LangLab 社区',
      content:
        '这里可以打卡、提问、纠错，也可以分享你的学习方法。先完成一节课，然后来发个帖吧！',
      createdAt: nowIso(),
      likeCount: 3,
      commentCount: 0,
    },
  ]

  return {
    users: [],
    sessions: [],
    preferences: [],
    courses,
    lessons,
    activity: [],
    lessonProgress: [],
    posts,
    achievements,
    userAchievements: [],
  }
}

