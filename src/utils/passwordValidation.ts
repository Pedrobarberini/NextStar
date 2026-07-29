export type PasswordRequirement = {
  id: "length" | "lowercase" | "number" | "uppercase";
  label: string;
  met: boolean;
};

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: "length",
      label: "8 caracteres",
      met: password.length >= 8
    },
    {
      id: "uppercase",
      label: "1 letra maiúscula",
      met: /[A-Z]/.test(password)
    },
    {
      id: "lowercase",
      label: "1 letra minúscula",
      met: /[a-z]/.test(password)
    },
    {
      id: "number",
      label: "1 número",
      met: /\d/.test(password)
    }
  ];
}

export function isStrongPassword(password: string) {
  return getPasswordRequirements(password).every(
    (requirement) => requirement.met
  );
}

export function getPasswordValidationMessage(password: string) {
  const unmetRequirement = getPasswordRequirements(password).find(
    (requirement) => !requirement.met
  );

  if (!password) {
    return "Digite uma senha.";
  }

  if (unmetRequirement?.id === "length") {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }

  if (unmetRequirement?.id === "uppercase") {
    return "Adicione pelo menos uma letra maiúscula à senha.";
  }

  if (unmetRequirement?.id === "lowercase") {
    return "Adicione pelo menos uma letra minúscula à senha.";
  }

  if (unmetRequirement?.id === "number") {
    return "Adicione pelo menos um número à senha.";
  }

  return "";
}
