/** A run of text drawn in one style: a piece of a row. */
export type Segment = { text: string; color?: string; isBold?: boolean; isDim?: boolean }

/** Where a branch stands against its upstream. */
export type Tracking = { upstream: string; ahead: number; behind: number; isGone: boolean }

/** A project of the session's folder: the folder itself or one right under it, with its checked-out branch. */
export type Repo = Tracking & {
  /** The folder's name, as the message lists it. */
  name: string
  /** The repository's top folder, absolute. */
  path: string
  head: string
  isDetached: boolean
  changes: number
}

/** A local or remote branch, as `git for-each-ref` reported it. */
export type Branch = Tracking & {
  name: string
  /** The local branch it is, or a remote one is checked out as: "feature/x" for "origin/feature/x". */
  localName: string
  /** Its upstream's remote and ref there ("origin", "refs/heads/x"); empty without one. */
  remote: string
  remoteRef: string
  isCurrent: boolean
  isRemote: boolean
  /** How long ago its tip was committed, compact: "3h", "2d", "4sem". */
  age: string
  subject: string
}

/** What the last switch or pull of a message came to. */
export type Notice = { text: string; isError: boolean }

/** One message in the transcript: the session's folder and where each project stood when it was asked. */
export type Message = {
  root: string
  repos: Repo[]
  /** The project "all branches" lists, by its path. */
  selected: string
  isExpanded: boolean
  /** Each project's branches, read the first time they were listed and again after a switch or pull. */
  branches: Record<string, Branch[]>
  /** The listed branch whose actions show under it; empty for none. */
  branch: string
  /** True while a switch or pull runs. */
  isBusy: boolean
  notice: Notice | null
}

declare module 'claude-code' {
  interface PluginState {
    'git-branches': { hasRepos: boolean; messages: Shaped<Record<string, Message>> }
  }
}
