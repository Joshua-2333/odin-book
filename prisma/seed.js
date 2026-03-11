// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const USER_COUNT = 15;
const POSTS_PER_USER = 4;
const SEED_PASSWORD = "Hunter_2333";

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // ---- USERS ----
  const users = [];

  for (let i = 0; i < USER_COUNT; i++) {
    const user = await prisma.user.create({
      data: {
        username: faker.internet.username(),
        email: faker.internet.email(),
        passwordHash,
      },
    });

    users.push(user);
  }

  console.log(`✅ Created ${users.length} users`);
  console.log(`🔐 All users use password: ${SEED_PASSWORD}`);

  // ---- POSTS ----
  const posts = [];

  for (const user of users) {
    for (let i = 0; i < POSTS_PER_USER; i++) {
      const post = await prisma.post.create({
        data: {
          content: faker.lorem.sentences({ min: 1, max: 3 }),
          authorId: user.id,
        },
      });

      posts.push(post);
    }
  }

  // ---- SPECIAL MEDIA POSTS ----

  const mediaPosts = [
    {
      content:
        "Just started reading Gachiakuta and the art style is absolutely insane.",
      mediaUrl: "/images/Gachiakuta.jpg",
    },
    {
      content:
        "When your code finally works after hours of debugging. Mic drop moment.",
      mediaUrl: "/images/mic-drop.gif",
    },
    {
      content:
        "Me realizing the bug was one missing bracket the whole time.",
      mediaUrl: "/images/spongebob.gif",
    },
    {
      content:
        "Wish I knew this before completing the game, this would have made the game a bit more easy for me.",
      mediaUrl: "https://www.youtube.com/embed/zxL-2f15LG0",
    },
  ];

  for (const mediaPost of mediaPosts) {
    const randomUser = faker.helpers.arrayElement(users);

    const post = await prisma.post.create({
      data: {
        content: mediaPost.content,
        mediaUrl: mediaPost.mediaUrl,
        authorId: randomUser.id,
      },
    });

    posts.push(post);
  }

  console.log(`✅ Created ${posts.length} posts`);

  // ---- COMMENTS ----
  for (const post of posts) {
    const commentCount = faker.number.int({ min: 0, max: 3 });

    for (let i = 0; i < commentCount; i++) {
      const randomUser = faker.helpers.arrayElement(users);

      await prisma.comment.create({
        data: {
          content: faker.lorem.sentence(),
          postId: post.id,
          authorId: randomUser.id,
        },
      });
    }
  }

  console.log("✅ Created comments");

  // ---- LIKES ----
  for (const post of posts) {
    const shuffledUsers = faker.helpers.shuffle(users);
    const likeCount = faker.number.int({ min: 0, max: 5 });

    for (let i = 0; i < likeCount; i++) {
      if (shuffledUsers[i].id === post.authorId) continue;

      try {
        await prisma.like.create({
          data: {
            userId: shuffledUsers[i].id,
            postId: post.id,
          },
        });
      } catch {}
    }
  }

  console.log("✅ Created likes");

  // ---- FOLLOWS ----
  for (const follower of users) {
    const shuffledUsers = faker.helpers.shuffle(
      users.filter(u => u.id !== follower.id)
    );

    const followCount = faker.number.int({ min: 2, max: 6 });

    for (let i = 0; i < followCount; i++) {
      const following = shuffledUsers[i];

      try {
        await prisma.follow.create({
          data: {
            followerId: follower.id,
            followingId: following.id,
            status: "ACCEPTED",
          },
        });
      } catch {}
    }
  }

  console.log("✅ Created follow relationships");
  console.log("🎉 Seeding complete!");
}

main()
  .catch(err => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });