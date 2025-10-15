import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const templates = [
  {
    templateKey: "modern-pro",
    name: "Modern Professional",
    category: "professional",
    difficulty: "intermediate",
    style: "modern",
    requiresPhoto: true,
    colorScheme: "blue",
    description: "Clean and contemporary design with subtle accents",
    htmlContent: "",
    cssStyles: "",
    thumbnail: "https://res.cloudinary.com/dtee0d1tu/image/upload/v1760531299/modern-pro_vfzdhw.png",
    colorSchemes: [
      { primary: "#3B82F6", secondary: "#60A5FA", accent: "#1E40AF" },
    ],
    fontOptions: ["Inter", "Roboto", "Open Sans"],
    layoutVariations: [{ name: "default", columns: 3 }],
  },
  {
    templateKey: "minimal-classic",
    name: "Minimal Classic",
    category: "professional",
    difficulty: "beginner",
    style: "classic",
    requiresPhoto: false,
    colorScheme: "gray",
    description: "Traditional layout focused on content",
    htmlContent: "",
    cssStyles: "",
    thumbnail: "https://res.cloudinary.com/dtee0d1tu/image/upload/v1760531299/minimal-classic_uw7fns.png",
    colorSchemes: [
      { primary: "#1F2937", secondary: "#4B5563", accent: "#111827" },
    ],
    fontOptions: ["Georgia", "Times New Roman", "Merriweather"],
    layoutVariations: [{ name: "default", columns: 1 }],
  },
  {
    templateKey: "creative-bold",
    name: "Creative Bold",
    category: "creative",
    difficulty: "intermediate",
    style: "modern",
    requiresPhoto: true,
    colorScheme: "purple",
    description: "Eye-catching design with vibrant colors",
    htmlContent: "",
    cssStyles: "",
    thumbnail: "https://res.cloudinary.com/dtee0d1tu/image/upload/v1760531299/creative-bold_nvnrx2.png",
    colorSchemes: [
      { primary: "#9333EA", secondary: "#EC4899", accent: "#7C3AED" },
    ],
    fontOptions: ["Montserrat", "Poppins", "Raleway"],
    layoutVariations: [{ name: "default", columns: 2 }],
  },
  {
    templateKey: "executive-elite",
    name: "Executive Elite",
    category: "executive",
    difficulty: "advanced",
    style: "luxury",
    requiresPhoto: true,
    colorScheme: "emerald",
    description: "Sophisticated layout for senior roles",
    htmlContent: "",
    cssStyles: "",
    thumbnail: "https://res.cloudinary.com/dtee0d1tu/image/upload/v1760531299/executive-elite_esisnh.png",
    colorSchemes: [
      { primary: "#059669", secondary: "#10B981", accent: "#047857" },
    ],
    fontOptions: ["Playfair Display", "Lora", "Crimson Text"],
    layoutVariations: [{ name: "default", columns: 4 }],
  },
  {
    templateKey: "tech-modern",
    name: "Tech Modern",
    category: "technical",
    difficulty: "intermediate",
    style: "tech",
    requiresPhoto: false,
    colorScheme: "cyan",
    description: "Developer-friendly with code-style aesthetics",
    htmlContent: "",
    cssStyles: "",
    thumbnail: "https://res.cloudinary.com/dtee0d1tu/image/upload/v1760531299/tech-modern_tjzim3.png",
    colorSchemes: [
      { primary: "#06B6D4", secondary: "#22D3EE", accent: "#0891B2" },
    ],
    fontOptions: ["Fira Code", "JetBrains Mono", "Source Code Pro"],
    layoutVariations: [{ name: "default", columns: 1 }],
  },
  {
    templateKey: "academic-formal",
    name: "Academic Formal",
    category: "academic",
    difficulty: "beginner",
    style: "formal",
    requiresPhoto: false,
    colorScheme: "amber",
    description: "Traditional academic CV format",
    htmlContent: "",
    cssStyles: "",
    thumbnail: "https://res.cloudinary.com/dtee0d1tu/image/upload/v1760531299/academic-formal_cjor2s.png",
    colorSchemes: [
      { primary: "#D97706", secondary: "#F59E0B", accent: "#B45309" },
    ],
    fontOptions: ["Garamond", "Baskerville", "Palatino"],
    layoutVariations: [{ name: "default", columns: 1 }],
  },
];

async function main() {
  console.log('Starting template seeding...');

  for (const template of templates) {
    const result = await prisma.resumeTemplate.upsert({
      where: { templateKey: template.templateKey },
      update: template,
      create: template,
    });
    console.log(`✅ Seeded template: ${result.name} (${result.templateKey})`);
  }

  console.log('✨ Template seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });