# Login

Refined authentication card with validation & social SSO

## Fonctionnalités

- Built with EasyUI Form & Button architecture
- Interactive password visibility toggle with Lucide icons
- Form validation for required fields & email regex format
- Spring-animated error banners and inline field alerts
- Configurable social SSO buttons (GitHub & Google)
- Remember me checkbox and "Forgot password?" callback hooks
- Responsive mobile/desktop dimensions with atmospheric glow header

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `title` | `string` | `'Welcome back'` | Primary card title text |
| `description` | `string` | `'Sign in to access your EasyUI workspace'` | Subtitle description below the title |
| `logo` | `React.ReactNode` | `<SparklesIcon />` | Brand badge or logo displayed at the top |
| `error` | `string \| null` | `null` | Server-side or authentication error banner message |
| `isLoading` | `boolean` | `false` | Submitting state displaying loader on submit button |
| `onSubmit` | `(data: LoginFormData) => void` | `undefined` | Form submission callback with email, password, rememberMe |
| `onForgotPassword` | `() => void` | `undefined` | Callback when forgot password link is clicked |
| `onSignUpClick` | `() => void` | `undefined` | Callback for secondary sign up switch action |
| `showSocialLogins` | `boolean` | `true` | Toggles GitHub and Google SSO buttons |
| `onSocialLogin` | `(provider: 'github' \| 'google' \| 'apple') => void` | `undefined` | Callback when social login button is pressed |

_Généré par Component Atlas depuis les métadonnées publiées par la source._