/** Un tramo de texto con un solo estilo: una pieza de una fila. */
export type Segment = { text: string; color?: string; isBold?: boolean; isDim?: boolean }

/** Cómo va el servidor dev de un proyecto. */
export type Status = 'stopped' | 'starting' | 'running' | 'exited'

/** Un proyecto de la carpeta con script `dev`, y cómo va su servidor. */
export type Project = {
  /** El nombre de la carpeta, como lo lista el mensaje. */
  name: string
  /** La carpeta del proyecto, absoluta. */
  path: string
  /** El script `dev` del package.json tal cual ("next dev -p 4000"): se corre sin pasar por el gestor de paquetes. */
  command: string
  status: Status
  /** Dónde escucha, leído de su salida; vacío mientras no se sepa. */
  url: string
  /** Las últimas líneas de su salida, sin colores. */
  lines: string[]
  /** Errores vistos desde que arrancó. */
  errors: number
  /** El último error con las líneas de stack que lo siguen. */
  lastError: string
  /** El código con que terminó solo; null mientras corre o si se detuvo. */
  exitCode: number | null
}

/** El resultado de la última acción de un mensaje. */
export type Notice = { text: string; isError: boolean }

/** Un mensaje en el chat: el proyecto elegido, si muestra la salida y el último aviso. */
export type Message = {
  root: string
  selected: string
  showLines: boolean
  isBusy: boolean
  notice: Notice | null
}

declare module 'claude-code' {
  interface PluginState {
    'dev-servers': { projects: Record<string, Project>; messages: Shaped<Record<string, Message>> }
  }
}
