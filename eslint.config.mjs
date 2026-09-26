import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // React Compiler rules introduced by eslint-config-next 16. They flag
    // pre-existing patterns (latest-value refs, mount-time setState) that
    // work today; kept as warnings until those components are refactored.
    rules: {
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  { ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"] },
]

export default eslintConfig
