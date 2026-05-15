import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter } as any);

const CATEGORIES = [
  "Beauty & Skincare", "Fashion & Clothing", "Electronics",
  "Health & Fitness", "Home & Kitchen", "Food & Beverages",
  "Education", "Real Estate", "Make Money", "Other",
];

const PRODUCTS = [
  { name: "Glow Serum Vitamin C", category: "Beauty & Skincare" },
  { name: "Whitening Cream Pakistan", category: "Beauty & Skincare" },
  { name: "Natural Facewash", category: "Beauty & Skincare" },
  { name: "Anti Aging Moisturizer", category: "Beauty & Skincare" },
  { name: "Hair Growth Oil Herbal", category: "Beauty & Skincare" },
  { name: "Lawn Printed Suit", category: "Fashion & Clothing" },
  { name: "Denim Jacket Women", category: "Fashion & Clothing" },
  { name: "Sneakers Running Shoes", category: "Fashion & Clothing" },
  { name: "Embroidered Kurta", category: "Fashion & Clothing" },
  { name: "Casual Shalwar Kameez", category: "Fashion & Clothing" },
  { name: "Wireless Earbuds", category: "Electronics" },
  { name: "Phone Holder Car Mount", category: "Electronics" },
  { name: "Laptop Stand Adjustable", category: "Electronics" },
  { name: "Smart Watch Fitness Band", category: "Electronics" },
  { name: "Portable Bluetooth Speaker", category: "Electronics" },
  { name: "Weight Loss Tea", category: "Health & Fitness" },
  { name: "Protein Powder Chocolate", category: "Health & Fitness" },
  { name: "Slimming Belt Waist", category: "Health & Fitness" },
  { name: "Herbal Supplement Energy", category: "Health & Fitness" },
  { name: "Yoga Mat Non Slip", category: "Health & Fitness" },
  { name: "Non Stick Cookware Set", category: "Home & Kitchen" },
  { name: "LED Desk Lamp Study", category: "Home & Kitchen" },
  { name: "Electric Kettle Stainless", category: "Home & Kitchen" },
  { name: "Bed Sheet Cotton King", category: "Home & Kitchen" },
  { name: "Air Fryer Digital", category: "Home & Kitchen" },
  { name: "Biryani Home Delivery", category: "Food & Beverages" },
  { name: "Green Tea Premium Pack", category: "Food & Beverages" },
  { name: "Protein Cookies Pack", category: "Food & Beverages" },
  { name: "Fresh Juice Subscription", category: "Food & Beverages" },
  { name: "Desi Ghee Pure", category: "Food & Beverages" },
  { name: "Freelancing Course Urdu", category: "Education" },
  { name: "Digital Marketing Course", category: "Education" },
  { name: "IELTS Preparation Online", category: "Education" },
  { name: "Graphic Design Bootcamp", category: "Education" },
  { name: "Python Programming Beginners", category: "Education" },
  { name: "DHA Lahore Plots", category: "Real Estate" },
  { name: "Bahria Town Apartments", category: "Real Estate" },
  { name: "Commercial Plaza Investment", category: "Real Estate" },
  { name: "Gulberg Residencia Islamabad", category: "Real Estate" },
  { name: "Smart Housing Society", category: "Real Estate" },
  { name: "Affiliate Marketing Pakistan", category: "Make Money" },
  { name: "Dropshipping Starter Kit", category: "Make Money" },
  { name: "Reselling Business Guide", category: "Make Money" },
  { name: "Passive Income Blueprint", category: "Make Money" },
  { name: "Ecommerce Business Course", category: "Make Money" },
  { name: "Car Seat Organizer", category: "Other" },
  { name: "Pet Accessories Bundle", category: "Other" },
  { name: "Travel Bag Waterproof", category: "Other" },
  { name: "Office Chair Ergonomic", category: "Other" },
  { name: "Garden Decoration Set", category: "Other" },
];

const PAGE_NAMES = [
  "ShopEasy PK", "TrendMart Pakistan", "HomeGuru PK", "StyleZone Pakistan",
  "TechBazaar", "GlowUp Beauty", "FitLife Pakistan", "PureNature",
  "UrbanStyle", "FreshBox PK", "SkillUp Academy", "PropMax Pakistan",
  "EarnBig PK", "MegaDeal Store", "QuickDelivery Pakistan",
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function calcScore(adCount: number, advertiserCount: number, firstSeenDaysAgo: number) {
  const bonus = firstSeenDaysAgo < 7 ? 30 : firstSeenDaysAgo < 14 ? 20 : firstSeenDaysAgo < 30 ? 10 : 0;
  return adCount * 0.5 + advertiserCount * 2 + bonus;
}

async function main() {
  console.log("Seeding database...");

  // Users
  const adminPw = await bcrypt.hash("admin123", 12);
  const userPw = await bcrypt.hash("user123", 12);

  await prisma.user.upsert({
    where: { email: "admin@adspypk.com" },
    update: {},
    create: { email: "admin@adspypk.com", name: "Admin", password: adminPw, role: "ADMIN", plan: "PRO" },
  });

  await prisma.user.upsert({
    where: { email: "free@adspypk.com" },
    update: {},
    create: { email: "free@adspypk.com", name: "Free User", password: userPw, role: "USER", plan: "FREE" },
  });

  await prisma.user.upsert({
    where: { email: "pro@adspypk.com" },
    update: {},
    create: {
      email: "pro@adspypk.com", name: "Pro User", password: userPw,
      role: "USER", plan: "PRO", planExpiresAt: daysAgo(-30),
    },
  });

  console.log("Users created");

  // Products + Ads
  let adSeq = 1;
  for (const p of PRODUCTS) {
    const daysAgoFirst = rand(1, 60);
    const adCount = rand(5, 80);
    const advertiserCount = rand(2, Math.min(adCount, 15));
    const score = calcScore(adCount, advertiserCount, daysAgoFirst);

    const product = await prisma.product.create({
      data: {
        name: p.name,
        category: p.category,
        adCount,
        advertiserCount,
        trendingScore: score,
        firstSeenAt: daysAgo(daysAgoFirst),
        lastSeenAt: daysAgo(rand(0, daysAgoFirst)),
        isActive: true,
      },
    });

    // Create 4 sample ads per product
    const adsToCreate = Math.min(4, adCount);
    for (let i = 0; i < adsToCreate; i++) {
      const pageName = PAGE_NAMES[rand(0, PAGE_NAMES.length - 1)];
      await prisma.ad.create({
        data: {
          fbAdId: `fb_seed_${adSeq++}_${product.id}_${i}`,
          pageId: `page_${rand(10000, 99999)}`,
          pageName,
          adTitle: `${p.name} — Best Price in Pakistan`,
          adBody: `Get the best ${p.name} delivered to your door across Pakistan! Cash on delivery available. Limited stock — order now!`,
          adCallToAction: "Shop Now",
          startDate: daysAgo(daysAgoFirst),
          platforms: rand(0, 1) === 0 ? ["facebook"] : ["facebook", "instagram"],
          spendLower: String(rand(500, 5000)),
          spendUpper: String(rand(5001, 50000)),
          estimatedReach: String(rand(10000, 500000)),
          adLibraryUrl: `https://www.facebook.com/ads/library/?id=${rand(100000, 999999)}`,
          productId: product.id,
          status: "ACTIVE",
        },
      });
    }
  }

  console.log(`Created ${PRODUCTS.length} products with ads`);

  // Sync logs
  for (let i = 0; i < 10; i++) {
    await prisma.syncLog.create({
      data: {
        status: i === 2 ? "FAILED" : "SUCCESS",
        productsFound: i === 2 ? 0 : rand(3, 12),
        adsFound: i === 2 ? 0 : rand(20, 80),
        duration: rand(15000, 90000),
        errorMessage: i === 2 ? "FB_TOKEN_EXPIRED: token invalid" : null,
        createdAt: daysAgo(i),
      },
    });
  }

  console.log("Sync logs created");
  console.log("\n✅ Seed complete!");
  console.log("   Admin:    admin@adspypk.com / admin123");
  console.log("   Free:     free@adspypk.com  / user123");
  console.log("   Pro:      pro@adspypk.com   / user123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
