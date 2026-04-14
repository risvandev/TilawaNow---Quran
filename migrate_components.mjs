import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/components/ScrollToTop.tsx',
  'src/components/NavLink.tsx',
  'src/components/layout/Footer.tsx',
  'src/components/landing/QuickStartSection.tsx',
  'src/components/landing/HeroSection.tsx',
  'src/components/landing/CTASection.tsx',
  'src/components/GlobalAudioPlayer.tsx',
  'src/components/auth/ProtectedRoute.tsx'
];

filesToUpdate.forEach(file => {
  const fullDest = path.join(process.cwd(), file);

  if (fs.existsSync(fullDest)) {
    let content = fs.readFileSync(fullDest, 'utf-8');

    // Replace react-router-dom imports
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
    content = content.replace(/location\.pathname/g, 'pathname');
    content = content.replace(/location\.state/g, '(null as any)');
    
    // Replace useNavigate() -> useRouter()
    content = content.replace(/useNavigate\(\)/g, 'useRouter()');
    content = content.replace(/useNavigate/g, 'useRouter');

    fs.writeFileSync(fullDest, content);
    console.log(`Updated ${file}`);
  }
});
