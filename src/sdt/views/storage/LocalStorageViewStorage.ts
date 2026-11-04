import type { SavedView, ViewStorage } from "./ViewStorage"

/**
 * Per-table localStorage backed view storage.
 *
 * Storage key: `dt:views:<scope>` — JSON array of SavedView.
 * Multiple tables on different `scope` values stay isolated.
 *
 * Safe across SSR (no-op when window is undefined).
 */
export class LocalStorageViewStorage implements ViewStorage {
	private readonly key: string

	constructor(scope: string) {
		this.key = `dt:views:${scope}`
	}

	private read(): SavedView[] {
		if (typeof window === "undefined") return []
		try {
			const raw = window.localStorage.getItem(this.key)
			if (!raw) return []
			const parsed = JSON.parse(raw)
			return Array.isArray(parsed) ? (parsed as SavedView[]) : []
		} catch {
			return []
		}
	}

	private write(views: SavedView[]): void {
		if (typeof window === "undefined") return
		try {
			window.localStorage.setItem(this.key, JSON.stringify(views))
		} catch {
			// Quota exceeded etc — silently drop. Future: surface to UI.
		}
	}

	async list(): Promise<SavedView[]> {
		return this.read()
	}

	async get(id: string): Promise<SavedView | null> {
		return this.read().find((v) => v.id === id) ?? null
	}

	async save(view: SavedView): Promise<SavedView> {
		const all = this.read()
		const idx = all.findIndex((v) => v.id === view.id)
		const now = new Date().toISOString()
		const next: SavedView = {
			...view,
			updatedAt: now,
			createdAt: all[idx]?.createdAt ?? view.createdAt ?? now,
		}
		if (idx >= 0) all[idx] = next
		else all.push(next)
		this.write(all)
		return next
	}

	async delete(id: string): Promise<void> {
		const all = this.read().filter((v) => v.id !== id)
		this.write(all)
	}

	async setDefault(id: string | null): Promise<void> {
		const all = this.read().map((v) => ({
			...v,
			isDefault: id !== null && v.id === id,
		}))
		this.write(all)
	}

	async setFavorite(id: string, favorite: boolean): Promise<void> {
		const all = this.read().map((v) =>
			v.id === id ? { ...v, isFavorite: favorite } : v,
		)
		this.write(all)
	}
}
