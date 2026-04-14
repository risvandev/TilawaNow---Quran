import fs from 'fs';
import path from 'path';

const SRC = path.join(process.cwd(), 'src/pages');
const APP = path.join(process.cwd(), 'src/app');

const routeMap = {
  'AIAssistance.tsx': 'ai/page.tsx',
  'About.tsx': 'about/page.tsx',
  'Contact.tsx': 'contact/page.tsx',
  'Dashboard.tsx': 'dashboard/page.tsx',
  'ForgotPassword.tsx': 'forgot-password/page.tsx',
  'HelpSupport.tsx': 'help/page.tsx',
  'Home.tsx': 'home/page.tsx',
  'Landing.tsx': 'page.tsx',
  'Login.tsx': 'login/page.tsx',
  'NotFound.tsx': 'not-found.tsx',
  'PrivacyPolicy.tsx': 'privacy/page.tsx',
  'ReadQuran.tsx': 'read/page.tsx', // Handle dynamic inside Next.js using catch-all or explicit later
  'ResetPassword.tsx': 'reset-password/page.tsx',
  'Settings.tsx': 'settings/page.tsx',
  'SignUp.tsx': 'signup/page.tsx',
  'SurahInfoPage.tsx': 'info/[surahId]/page.tsx',
  'SurahStoryPage.tsx': 'story/[surahId]/page.tsx',
  'TermsConditions.tsx': 'terms/page.tsx',
};

// Create app dir
if (!fs.existsSync(APP)) {
  fs.mkdirSync(APP, { recursive: true });
}

Object.entries(routeMap).forEach(([srcFile, destPath]) => {
  const fullSrc = path.join(SRC, srcFile);
  const fullDest = path.join(APP, destPath);

  if (fs.existsSync(fullSrc)) {
    const dir = path.dirname(fullDest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let content = fs.readFileSync(fullSrc, 'utf-8');

    // Make client component
    if (!content.startsWith('"use client')) {
      content = '"use client";\n\n' + content;
    }

    // Replace react-router-dom imports
    // 1. Link, useLocation -> next
    content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-router-dom['"];/g, (match, imports) => {
      let result = [];
      const parts = imports.split(',').map(s => s.trim());
      
      const navImports = parts.filter(p => !['Link', 'Navigate'].includes(p));
      if (navImports.length > 0) {
        // replace useLocation with usePathname
        const finalNav = navImports.map(n => n === 'useLocation' ? 'usePathname' : n);
        result.push(`import { ${finalNav.join(', ')} } from "next/navigation";`);
      }
      
      if (parts.includes('Link')) {
        result.push(`import Link from "next/link";`);
      }
      return result.join('\n');
    });

    // Replace <Link to="..."> with <Link href="...">
    content = content.replace(/<Link([^>]+)to=/g, '<Link$1href=');
    
    // Replace useLocation() usages
    content = content.replace(/useLocation\(\)/g, 'usePathname()');
    // Replace location.pathname usages
    content = content.replace(/location\.pathname/g, 'pathname');
    // Replace location.state
    content = content.replace(/location\.state/g, '(null as any)'); // Next.js doesn't have location.state
    
    // Replace useNavigate() -> useRouter()
    content = content.replace(/useNavigate\(\)/g, 'useRouter()');
    // Important: replace useNavigate import specifically to useRouter 
    // it was already caught in navImports, so we just replace the word if.
    // Actually, `useNavigate` was imported as `useNavigate` from next/navigation? No, it doesn't exist.
    // It should be `useRouter`.
    content = content.replace(/useNavigate/g, 'useRouter');

    fs.writeFileSync(fullDest, content);
    console.log(`Migrated ${srcFile} to ${destPath}`);
  }
});
