# Legal Premium Theme

Premium theme for legal firms and professional services built with Bootstrap 5.

## Features

- ✅ **Bootstrap 5** - Fully responsive and redistributable
- ✅ **Dark/Light Mode** - Theme toggle with localStorage persistence
- ✅ **All Sections** - Hero, Services, Industries, Case Studies, Insights, Contact
- ✅ **Simplified Design** - Clean, professional look without complex effects
- ✅ **SEO Ready** - Semantic HTML and proper meta tags
- ✅ **Accessible** - ARIA labels and keyboard navigation
- ✅ **Performance** - Lazy loading images and optimized assets

## Installation

1. The theme is already installed in `src/themes/legal-premium/`
2. Activate it through the LexCMS admin panel
3. Configure custom settings in Theme Settings

## Custom Settings

Available in the admin panel:

- **Color Scheme**: Light or Dark mode
- **Primary Color**: Main brand color (default: #2d6aff)
- **Secondary Color**: Accent color (default: #40ebd0)
- **Hero Title**: Main headline
- **Hero Subtitle**: Subheadline
- **Company Info**: Phone, email, address
- **Section Toggles**: Show/hide sections

## Templates

- `home.tsx` - Homepage with all sections
- `blog.tsx` - Blog listing page
- `post.tsx` - Single post view
- `page.tsx` - Static pages
- `category.tsx` - Category archive
- `tag.tsx` - Tag archive
- `search.tsx` - Search results
- `404.tsx` - Error page

## Partials

- `Header.tsx` - Navigation with theme toggle
- `Footer.tsx` - Multi-column footer
- `Hero.tsx` - Hero section with metrics

## Assets

### CSS
- Bootstrap 5.3.2 (CDN)
- Custom theme styles (`assets/css/theme.css`)

### JavaScript
- Bootstrap 5.3.2 Bundle (CDN)
- Theme functionality (`assets/js/theme.js`)

## Customization

### Colors

Edit in `theme.json` custom settings or override in `assets/css/theme.css`:

```css
:root {
  --bs-primary: #2d6aff;
  --bs-secondary: #40ebd0;
}
```

### Sections

Toggle sections in theme settings or edit `home.tsx` template.

### Fonts

Default: Inter from Google Fonts. Change in `Layout.tsx`:

```tsx
<link 
  href="https://fonts.googleapis.com/css2?family=YourFont:wght@400;500;600;700&display=swap" 
  rel="stylesheet"
/>
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Credits

- Design inspired by Lexia & Partners
- Built with Bootstrap 5
- Icons from Bootstrap Icons
- Images from Unsplash

## License

MIT License - Free to use and modify
