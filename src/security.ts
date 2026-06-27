import { resolve, sep } from 'node:path'
import type { MindMapDocument, MindMapPlan } from './types'

export class AuthorizationError extends Error {
  constructor(message = 'The caller does not own this resource') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function assertPlanOwner(plan: MindMapPlan | undefined, ownerId: string): MindMapPlan {
  if (!plan || plan.ownerId !== ownerId) throw new AuthorizationError()
  return plan
}

export function assertDocumentOwner(
  document: MindMapDocument | undefined,
  ownerId: string,
): MindMapDocument {
  if (!document || document.ownerId !== ownerId) throw new AuthorizationError()
  return document
}

export function assertAllowedLocalPdf(path: string, allowedRoots: string[]): string {
  const absolute = resolve(path)
  const allowed = allowedRoots.some((root) => {
    const absoluteRoot = resolve(root)
    return absolute === absoluteRoot || absolute.startsWith(`${absoluteRoot}${sep}`)
  })
  if (!allowed) throw new ValidationError('local_path must stay under a configured document root')
  if (!absolute.toLowerCase().endsWith('.pdf'))
    throw new ValidationError('only PDF documents are accepted')
  return absolute
}
