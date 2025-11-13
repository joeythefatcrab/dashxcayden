import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.activity.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.item.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.curriculum.deleteMany();
  await prisma.glossaryTerm.deleteMany();
  await prisma.student.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users...");

  // Create admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@homeschool.com",
      password: await bcrypt.hash("password123", 10),
      name: "Admin User",
      role: "ADMIN",
    },
  });

  // Create teacher
  const teacher = await prisma.user.create({
    data: {
      email: "teacher@homeschool.com",
      password: await bcrypt.hash("password123", 10),
      name: "Ms. Johnson",
      role: "TEACHER",
    },
  });

  // Create parent
  const parent = await prisma.user.create({
    data: {
      email: "parent@homeschool.com",
      password: await bcrypt.hash("password123", 10),
      name: "Sarah Smith",
      role: "PARENT",
      digestFrequency: "daily",
    },
  });

  console.log("Creating students...");

  // Create students
  const student1 = await prisma.student.create({
    data: {
      name: "Emma Smith",
      parentId: parent.id,
      grade: 8,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      name: "Noah Smith",
      parentId: parent.id,
      grade: 6,
    },
  });

  console.log("Creating glossary terms...");

  // Create glossary terms
  await prisma.glossaryTerm.createMany({
    data: [
      {
        term: "photosynthesis",
        definition: "The process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of sugar.",
        derivation: "From Greek 'photo' (light) and 'synthesis' (putting together)",
      },
      {
        term: "mitochondria",
        definition: "The powerhouse of the cell - organelles that generate most of the cell's supply of ATP, used as a source of chemical energy.",
        derivation: "From Greek 'mitos' (thread) and 'chondros' (granule)",
      },
      {
        term: "ecosystem",
        definition: "A biological community of interacting organisms and their physical environment.",
        derivation: "From Greek 'oikos' (house) and 'systema' (organized whole)",
      },
    ],
  });

  console.log("Creating curriculum...");

  // Create U.S. History curriculum
  const curriculum = await prisma.curriculum.create({
    data: {
      name: "U.S. History: The Civil War",
      description: "A comprehensive study of the American Civil War, from its causes to its lasting impact on American society.",
      subject: "History",
      grade: 8,
      provider: "American History Academy",
      createdById: teacher.id,
      units: {
        create: [
          {
            title: "Causes of the Civil War",
            description: "Understanding the economic, social, and political factors that led to the Civil War",
            order: 1,
            lessons: {
              create: [
                {
                  title: "Introduction to Pre-Civil War America",
                  description: "Overview of the United States in the 1850s",
                  order: 1,
                  threshold: 70,
                  objectives: ["8.H.1", "8.H.2"],
                  contentMd: `# Introduction to Pre-Civil War America

## The Divided Nation

In the 1850s, the United States was rapidly expanding westward. However, this expansion brought serious questions about whether new states would allow [[slavery]] or be free states.

## Key Issues

1. **Economic Differences**: The North had an industrial economy, while the South relied on [[agriculture]] and slavery.
2. **States' Rights**: Southern states believed they had the right to make their own decisions about slavery.
3. **Abolition Movement**: Growing numbers of people in the North opposed slavery on moral grounds.

## The Compromise of 1850

Congress attempted to ease tensions by allowing some territories to decide the slavery question for themselves through [[popular sovereignty]].`,
                  items: {
                    create: [
                      {
                        type: "MCQ",
                        order: 1,
                        prompt: "What was the main economic difference between the North and South before the Civil War?",
                        choices: [
                          "The North relied on agriculture while the South was industrial",
                          "The North was industrial while the South relied on agriculture",
                          "Both regions had identical economies",
                          "Neither region had a developed economy",
                        ],
                        answerKey: { correct: [1] },
                        points: 1,
                      },
                      {
                        type: "TRUE_FALSE",
                        order: 2,
                        prompt: "The Compromise of 1850 allowed some territories to decide the slavery question through popular sovereignty.",
                        choices: ["True", "False"],
                        answerKey: { correct: [0] },
                        points: 1,
                      },
                      {
                        type: "SHORT_ANSWER",
                        order: 3,
                        prompt: "What does 'states' rights' refer to in the context of the Civil War?",
                        answerKey: {
                          patterns: [
                            "/states.*right.*own.*decision/i",
                            "/southern states.*make.*own.*laws/i",
                            "states rights to decide about slavery",
                          ],
                        },
                        points: 2,
                      },
                    ],
                  },
                },
                {
                  title: "The Abolitionist Movement",
                  description: "Key figures and events in the fight against slavery",
                  order: 2,
                  threshold: 75,
                  objectives: ["8.H.3", "8.H.4"],
                  contentMd: `# The Abolitionist Movement

## Fighting for Freedom

The [[abolitionist]] movement grew stronger in the 1840s and 1850s. Abolitionists believed that slavery was morally wrong and should be ended immediately.

## Key Figures

- **Frederick Douglass**: Former slave who became a powerful speaker and writer
- **Harriet Tubman**: Conductor on the Underground Railroad who helped hundreds escape slavery
- **William Lloyd Garrison**: Published the anti-slavery newspaper "The Liberator"

## Uncle Tom's Cabin

Harriet Beecher Stowe's novel shocked many Northerners with its depiction of slavery's brutality.`,
                  items: {
                    create: [
                      {
                        type: "MCQ",
                        order: 1,
                        prompt: "Who was Frederick Douglass?",
                        choices: [
                          "A slave owner who defended slavery",
                          "A former slave who became an abolitionist speaker",
                          "A politician who supported states' rights",
                          "A general in the Confederate Army",
                        ],
                        answerKey: { correct: [1] },
                        points: 1,
                      },
                      {
                        type: "MCQ",
                        order: 2,
                        prompt: "What was the Underground Railroad?",
                        choices: [
                          "An actual railroad built underground",
                          "A network that helped enslaved people escape to freedom",
                          "A mining operation in the South",
                          "A transportation system for Confederate troops",
                        ],
                        answerKey: { correct: [1] },
                        points: 1,
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            title: "The War Begins",
            description: "The outbreak of the Civil War and early battles",
            order: 2,
            lessons: {
              create: [
                {
                  title: "Fort Sumter and the Start of War",
                  description: "The first shots of the Civil War",
                  order: 1,
                  threshold: 70,
                  objectives: ["8.H.5"],
                  contentMd: `# Fort Sumter: The War Begins

## April 12, 1861

Confederate forces opened fire on Fort Sumter in Charleston Harbor, South Carolina. This marked the beginning of the Civil War.

## The Nation Divides

After Fort Sumter, President Lincoln called for 75,000 volunteers to put down the rebellion. This prompted four more Southern states to secede and join the [[Confederacy]].`,
                  items: {
                    create: [
                      {
                        type: "MCQ",
                        order: 1,
                        prompt: "When did the Civil War begin?",
                        choices: [
                          "April 12, 1861",
                          "July 4, 1861",
                          "January 1, 1860",
                          "December 20, 1860",
                        ],
                        answerKey: { correct: [0] },
                        points: 1,
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Creating enrollments...");

  // Enroll students
  const enrollment1 = await prisma.enrollment.create({
    data: {
      studentId: student1.id,
      curriculumId: curriculum.id,
      progress: {
        // First lesson is unlocked by default
      },
    },
  });

  const enrollment2 = await prisma.enrollment.create({
    data: {
      studentId: student2.id,
      curriculumId: curriculum.id,
      progress: {},
    },
  });

  // Get the first lesson
  const firstLesson = await prisma.lesson.findFirst({
    where: { unit: { curriculumId: curriculum.id } },
    orderBy: { order: "asc" },
  });

  if (firstLesson) {
    console.log("Creating sample attempt...");

    // Create a sample attempt for student1
    await prisma.attempt.create({
      data: {
        studentId: student1.id,
        lessonId: firstLesson.id,
        score: 85,
        maxScore: 4,
        earned: 3,
        detail: {
          item1: { answer: 1, correct: true, points: 1 },
          item2: { answer: 0, correct: true, points: 1 },
          item3: { answer: "States rights to decide about slavery", correct: true, points: 2 },
        },
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        studentId: student1.id,
        type: "lesson_completed",
        lessonId: firstLesson.id,
        metadata: {
          score: 85,
          threshold: 70,
          passed: true,
        },
      },
    });
  }

  console.log("✅ Seed completed!");
  console.log("\n📧 Test Accounts:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Admin:   admin@homeschool.com    / password123");
  console.log("Teacher: teacher@homeschool.com  / password123");
  console.log("Parent:  parent@homeschool.com   / password123");
  console.log("\n📚 Created:");
  console.log("- 1 curriculum: U.S. History: The Civil War");
  console.log("- 2 units with 3 lessons total");
  console.log("- 2 students enrolled");
  console.log("- 3 glossary terms");
  console.log("- Sample test data and attempts");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
