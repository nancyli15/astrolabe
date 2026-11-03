// Every real source file, as text, keyed by path: { '/src/App.jsx': '...' }.
//
// import.meta.glob is a Vite feature that finds files matching a pattern while the
// site is being built, and `?raw` asks for their text instead of running them.
// So `cat /src/App.jsx` and the code snippets always show the code that's really
// deployed. Nothing here is a copy, so nothing can go out of date.
export const SOURCE_FILES = import.meta.glob('/src/**/*.{js,jsx,css}', {
  query: '?raw',
  import: 'default',
  eager: true,
});
