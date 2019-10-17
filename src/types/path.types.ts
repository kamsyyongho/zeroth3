
export interface Path {
  to: string
  title: string
}

export const PATHS: { [x: string]: Path } = {
  home: {
    to: "/",
    title: "home"
  },
  IAM: {
    to: "/iam",
    title: "IAM"
  },
}
