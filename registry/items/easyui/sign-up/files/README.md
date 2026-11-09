# Sign Up

Multi-step capable user registration with strength telemetry

## Fonctionnalités

- Integrated live 4-tier password strength indicator bar
- Password confirmation matching validation
- Interactive eye icons for show/hide password visibility
- Terms of service and privacy agreement checkbox validation
- Customizable social onboarding SSO buttons (GitHub & Google)
- Submitting state with monochrome button spinner
- Responsive layout with atmospheric glow and dark slate tokens

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `title` | `string` | `'Create an account'` | Primary card title text |
| `description` | `string` | `'Join EasyUI to access components and templates'` | Subtitle description below the title |
| `logo` | `React.ReactNode` | `<SparklesIcon />` | Brand badge or logo displayed at the top |
| `error` | `string \| null` | `null` | Server-side registration error banner message |
| `isLoading` | `boolean` | `false` | Submitting state displaying loader on submit button |
| `onSubmit` | `(data: SignUpFormData) => void` | `undefined` | Form submission callback with name, email, password, confirmPassword, agreeToTerms |
| `onSignInClick` | `() => void` | `undefined` | Callback for switching to login view |
| `showSocialSignUp` | `boolean` | `true` | Toggles GitHub and Google SSO buttons |
| `requireConfirmPassword` | `boolean` | `true` | Includes confirmation password field and checks match |
| `termsText` | `React.ReactNode` | `Default Terms & Privacy links` | Custom agreement label text or JSX |

_Généré par Component Atlas depuis les métadonnées publiées par la source._