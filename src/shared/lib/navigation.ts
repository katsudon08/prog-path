/**
 * next/navigation の暫定代替
 *
 * #265 で TanStack Router に差し替え、このファイルごと削除する。
 * 遷移はフルリロードになるが、既存コードの呼び出し方を変えずに済ませることを優先する。
 */

/** 現在のパス名を返す */
export function usePathname(): string {
  return window.location.pathname
}

/** 現在のクエリ文字列を返す */
export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search)
}

/** 画面遷移の手段を返す */
export function useRouter(): { push: (href: string) => void } {
  return {
    push: (href: string) => {
      window.location.assign(href)
    },
  }
}
