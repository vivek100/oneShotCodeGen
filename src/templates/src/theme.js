import { createTheme, responsiveFontSizes } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
    background: { default: "#f5f5f5" },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    allVariants: {
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    },
    button: {
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    },
    h1: { 
      fontSize: "3.5rem",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      lineHeight: 1.2
    },
    h2: { 
      fontSize: "2.25rem",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      lineHeight: 1.3
    },
    h3: { 
      fontSize: "1.875rem",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      lineHeight: 1.4
    },
    h4: { 
      fontSize: "1.5rem",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      lineHeight: 1.4
    },
    h5: { 
      fontSize: "1.25rem",
      fontWeight: 600,
      letterSpacing: "-0.01em",
      lineHeight: 1.5
    },
    h6: { 
      fontSize: "1rem",
      fontWeight: 600,
      letterSpacing: "-0.01em",
      lineHeight: 1.5
    },
    body1: {
      fontSize: "1rem",
      letterSpacing: "-0.01em",
      lineHeight: 1.5
    },
    body2: {
      fontSize: "0.875rem",
      letterSpacing: "-0.01em",
      lineHeight: 1.5
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'Inter';
          font-style: normal;
          font-display: swap;
          font-weight: 400;
          unicodeRange: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF;
        }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: 'Inter',
          textTransform: 'none',
          fontWeight: 500,
          letterSpacing: '-0.01em',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { 
          borderRadius: 8, 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)" 
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: { border: "none" },
        cell: { borderBottom: "1px solid rgba(224,224,224,1)" },
        columnHeader: {
          backgroundColor: "#fafafa",
          borderBottom: "1px solid rgba(224,224,224,1)",
        },
      },
    },
  },
});

export default responsiveFontSizes(theme);
