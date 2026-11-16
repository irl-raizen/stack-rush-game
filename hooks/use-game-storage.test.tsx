// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { useGameStorage } from "./use-game-storage"

beforeEach(() => {
  window.localStorage.clear()
})

describe("useGameStorage account isolation", () => {
  it("restores independent scores, coins, skins, settings, and run counts for each account", async () => {
    const { result, rerender } = renderHook(({ userId }) => useGameStorage(userId), {
      initialProps: { userId: "account-a" as string | null },
    })

    await waitFor(() => expect(result.current.hydrated).toBe(true))
    act(() => {
      result.current.update({
        bestScore: 420,
        coins: 130,
        selectedSkin: "neon",
        soundEnabled: false,
        interstitialRunCount: 7,
      })
    })

    rerender({ userId: "account-b" })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.state.bestScore).toBe(0)
    expect(result.current.state.coins).toBe(0)
    act(() => {
      result.current.update({ bestScore: 85, coins: 25, soundEnabled: true, interstitialRunCount: 2 })
    })

    rerender({ userId: "account-a" })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.state).toMatchObject({
      bestScore: 420,
      coins: 130,
      selectedSkin: "neon",
      soundEnabled: false,
      interstitialRunCount: 7,
    })

    rerender({ userId: "account-b" })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.state).toMatchObject({
      bestScore: 85,
      coins: 25,
      selectedSkin: "aurora",
      soundEnabled: true,
      interstitialRunCount: 2,
    })
  })

  it("ignores a delayed callback captured by a previous account", async () => {
    const { result, rerender } = renderHook(({ userId }) => useGameStorage(userId), {
      initialProps: { userId: "account-a" as string | null },
    })

    await waitFor(() => expect(result.current.hydrated).toBe(true))
    const staleSubmitRun = result.current.submitRun

    rerender({ userId: "account-b" })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    act(() => staleSubmitRun(900, 200, 8, 4))

    expect(result.current.state).toMatchObject({ bestScore: 0, coins: 0, totalRuns: 0 })
    expect(window.localStorage.getItem("stack-rush-v2:account-b")).toBeNull()
  })
})
