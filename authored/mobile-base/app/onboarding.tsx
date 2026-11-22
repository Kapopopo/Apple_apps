import { useState } from 'react';
import { appConfig } from '@/config/app';
import { onboardingLayouts } from '@/features/onboarding/layouts';
import { Question } from '@/features/onboarding/question';
import { useStorage, type Answers } from '@/lib/storage';

const { slides, questions } = appConfig.onboarding;
const total = slides.length + questions.length;

export default function Onboarding() {
  const { completeOnboarding } = useStorage();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const nav = {
    step,
    total,
    onBack: () => setStep((s) => Math.max(0, s - 1)),
    // La garde de app/_layout.tsx enchaîne sur le paywall.
    onNext: () => (step < total - 1 ? setStep(step + 1) : void completeOnboarding(answers)),
  };

  if (step < slides.length) {
    const Layout = onboardingLayouts[appConfig.layouts.onboarding];
    return <Layout slides={slides} {...nav} />;
  }
  const question = questions[step - slides.length];
  return (
    <Question
      question={question}
      value={answers[question.id] ?? []}
      onChange={(value) => setAnswers((all) => ({ ...all, [question.id]: value }))}
      {...nav}
    />
  );
}
