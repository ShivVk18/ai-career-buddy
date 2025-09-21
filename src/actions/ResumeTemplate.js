'use server'

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getResumeTemplates() {
  try {
    return await db.resumeTemplate.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ],
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw new Error("Failed to fetch templates");
  }
}

export async function createDefaultTemplates() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const templates = [
    {
      name: "Professional Classic",
      category: "professional",
      difficulty: "easy",
      style: "classic",
      thumbnail: "https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?w=400",
      htmlContent: `
        <div class="resume-template professional-classic">
          <header class="resume-header">
            <h1 class="name">{{name}}</h1>
            <div class="contact-info">
              {{contactInfo}}
            </div>
          </header>
          
          <section class="section">
            <h2 class="section-title">Professional Summary</h2>
            <div class="section-content">
              {{summary}}
            </div>
          </section>
          
          <section class="section">
            <h2 class="section-title">Skills</h2>
            <div class="section-content">
              {{skills}}
            </div>
          </section>
          
          <section class="section">
            <h2 class="section-title">Work Experience</h2>
            <div class="section-content">
              {{experience}}
            </div>
          </section>
          
          <section class="section">
            <h2 class="section-title">Education</h2>
            <div class="section-content">
              {{education}}
            </div>
          </section>
          
          <section class="section">
            <h2 class="section-title">Projects</h2>
            <div class="section-content">
              {{projects}}
            </div>
          </section>
        </div>
      `,
      cssStyles: `
        .resume-template {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
        }
        
        .resume-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
        }
        
        .name {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 10px;
          color: #1e40af;
        }
        
        .contact-info {
          font-size: 1rem;
          color: #666;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 1.4rem;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 15px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
        }
        
        .section-content {
          padding-left: 10px;
        }
        
        .experience-item, .education-item, .project-item {
          margin-bottom: 20px;
        }
        
        .item-title {
          font-weight: bold;
          color: #374151;
          font-size: 1.1rem;
        }
        
        .item-organization {
          color: #6b7280;
          font-style: italic;
          margin-bottom: 5px;
        }
        
        .item-date {
          color: #9ca3af;
          font-size: 0.9rem;
          margin-bottom: 8px;
        }
        
        .item-description {
          color: #4b5563;
        }
        
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .skill-tag {
          background: #eff6ff;
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
        }
      `,
      colorSchemes: [
        { primary: "#2563eb", secondary: "#1e40af", accent: "#3b82f6" },
        { primary: "#059669", secondary: "#047857", accent: "#10b981" },
        { primary: "#dc2626", secondary: "#b91c1c", accent: "#ef4444" }
      ],
      fontOptions: ["Arial", "Georgia", "Helvetica"],
      layoutVariations: [
        { name: "Standard", value: "standard" },
        { name: "Compact", value: "compact" }
      ]
    },
    {
      name: "Modern Creative",
      category: "creative",
      difficulty: "medium",
      style: "modern",
      thumbnail: "https://images.pexels.com/photos/7688340/pexels-photo-7688340.jpeg?w=400",
      htmlContent: `
        <div class="resume-template modern-creative">
          <div class="sidebar">
            <div class="profile-section">
              <h1 class="name">{{name}}</h1>
              <div class="contact-info">
                {{contactInfo}}
              </div>
            </div>
            
            <section class="sidebar-section">
              <h2 class="sidebar-title">Skills</h2>
              <div class="section-content">
                {{skills}}
              </div>
            </section>
          </div>
          
          <div class="main-content">
            <section class="section">
              <h2 class="section-title">Professional Summary</h2>
              <div class="section-content">
                {{summary}}
              </div>
            </section>
            
            <section class="section">
              <h2 class="section-title">Work Experience</h2>
              <div class="section-content">
                {{experience}}
              </div>
            </section>
            
            <section class="section">
              <h2 class="section-title">Education</h2>
              <div class="section-content">
                {{education}}
              </div>
            </section>
            
            <section class="section">
              <h2 class="section-title">Projects</h2>
              <div class="section-content">
                {{projects}}
              </div>
            </section>
          </div>
        </div>
      `,
      cssStyles: `
        .resume-template.modern-creative {
          display: flex;
          max-width: 900px;
          margin: 0 auto;
          font-family: 'Helvetica', sans-serif;
          background: white;
          min-height: 100vh;
        }
        
        .sidebar {
          width: 300px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
        }
        
        .profile-section {
          margin-bottom: 40px;
        }
        
        .name {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 15px;
        }
        
        .contact-info {
          font-size: 0.9rem;
          line-height: 1.8;
        }
        
        .sidebar-section {
          margin-bottom: 30px;
        }
        
        .sidebar-title {
          font-size: 1.2rem;
          font-weight: bold;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .main-content {
          flex: 1;
          padding: 40px;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #2d3748;
          margin-bottom: 20px;
          position: relative;
        }
        
        .section-title::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 50px;
          height: 3px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .section-content {
          color: #4a5568;
        }
        
        .experience-item, .education-item, .project-item {
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .item-title {
          font-weight: bold;
          color: #2d3748;
          font-size: 1.1rem;
          margin-bottom: 5px;
        }
        
        .item-organization {
          color: #718096;
          font-weight: 500;
          margin-bottom: 5px;
        }
        
        .item-date {
          color: #a0aec0;
          font-size: 0.9rem;
          margin-bottom: 10px;
        }
        
        .item-description {
          color: #4a5568;
          line-height: 1.6;
        }
        
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .skill-tag {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 0.85rem;
        }
      `,
      colorSchemes: [
        { primary: "#667eea", secondary: "#764ba2", accent: "#f093fb" },
        { primary: "#4facfe", secondary: "#00f2fe", accent: "#43e97b" },
        { primary: "#fa709a", secondary: "#fee140", accent: "#ffecd2" }
      ],
      fontOptions: ["Helvetica", "Arial", "Calibri"],
      layoutVariations: [
        { name: "Sidebar Left", value: "sidebar-left" },
        { name: "Sidebar Right", value: "sidebar-right" }
      ]
    },
    {
      name: "Minimalist Clean",
      category: "minimalist",
      difficulty: "easy",
      style: "clean",
      thumbnail: "https://images.pexels.com/photos/7688334/pexels-photo-7688334.jpeg?w=400",
      htmlContent: `
        <div class="resume-template minimalist-clean">
          <header class="resume-header">
            <h1 class="name">{{name}}</h1>
            <div class="contact-info">
              {{contactInfo}}
            </div>
          </header>
          
          <section class="section">
            <h2 class="section-title">Summary</h2>
            <div class="section-content">
              {{summary}}
            </div>
          </section>
          
          <div class="two-column">
            <div class="left-column">
              <section class="section">
                <h2 class="section-title">Experience</h2>
                <div class="section-content">
                  {{experience}}
                </div>
              </section>
              
              <section class="section">
                <h2 class="section-title">Projects</h2>
                <div class="section-content">
                  {{projects}}
                </div>
              </section>
            </div>
            
            <div class="right-column">
              <section class="section">
                <h2 class="section-title">Skills</h2>
                <div class="section-content">
                  {{skills}}
                </div>
              </section>
              
              <section class="section">
                <h2 class="section-title">Education</h2>
                <div class="section-content">
                  {{education}}
                </div>
              </section>
            </div>
          </div>
        </div>
      `,
      cssStyles: `
        .resume-template.minimalist-clean {
          max-width: 800px;
          margin: 0 auto;
          padding: 50px 40px;
          font-family: 'Georgia', serif;
          line-height: 1.7;
          color: #2d3748;
          background: white;
        }
        
        .resume-header {
          margin-bottom: 40px;
        }
        
        .name {
          font-size: 3rem;
          font-weight: 300;
          margin-bottom: 10px;
          color: #1a202c;
          letter-spacing: -1px;
        }
        
        .contact-info {
          font-size: 1rem;
          color: #718096;
          font-style: italic;
        }
        
        .section {
          margin-bottom: 35px;
        }
        
        .section-title {
          font-size: 1.1rem;
          font-weight: bold;
          color: #1a202c;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .section-content {
          font-size: 0.95rem;
        }
        
        .two-column {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 40px;
          margin-top: 40px;
        }
        
        .experience-item, .education-item, .project-item {
          margin-bottom: 25px;
        }
        
        .item-title {
          font-weight: 600;
          color: #2d3748;
          font-size: 1rem;
          margin-bottom: 3px;
        }
        
        .item-organization {
          color: #718096;
          margin-bottom: 3px;
          font-size: 0.9rem;
        }
        
        .item-date {
          color: #a0aec0;
          font-size: 0.85rem;
          margin-bottom: 8px;
        }
        
        .item-description {
          color: #4a5568;
          font-size: 0.9rem;
        }
        
        .skills-list {
          line-height: 2;
        }
        
        .skill-tag {
          color: #4a5568;
          margin-right: 15px;
          font-size: 0.9rem;
        }
        
        .skill-tag::after {
          content: '•';
          margin-left: 15px;
          color: #cbd5e0;
        }
        
        .skill-tag:last-child::after {
          display: none;
        }
      `,
      colorSchemes: [
        { primary: "#1a202c", secondary: "#2d3748", accent: "#718096" },
        { primary: "#2d3748", secondary: "#4a5568", accent: "#718096" },
        { primary: "#1a365d", secondary: "#2c5282", accent: "#3182ce" }
      ],
      fontOptions: ["Georgia", "Times New Roman", "Crimson Text"],
      layoutVariations: [
        { name: "Two Column", value: "two-column" },
        { name: "Single Column", value: "single-column" }
      ]
    }
  ];

  try {
    const createdTemplates = [];
    for (const template of templates) {
      const existing = await db.resumeTemplate.findFirst({
        where: { name: template.name }
      });
      
      if (!existing) {
        const created = await db.resumeTemplate.create({
          data: template
        });
        createdTemplates.push(created);
      }
    }
    
    revalidatePath("/resume");
    return createdTemplates;
  } catch (error) {
    console.error("Error creating templates:", error);
    throw new Error("Failed to create templates");
  }
}

export async function getTemplateById(id) {
  try {
    return await db.resumeTemplate.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    throw new Error("Failed to fetch template");
  }
}

export async function incrementTemplateUsage(templateId) {
  try {
    return await db.resumeTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });
  } catch (error) {
    console.error("Error updating template usage:", error);
    
  }
}