export class PriorityQueue<T> {
  private heap: { priority: number; value: T }[] = []

  push(value: T, priority: number) {
    this.heap.push({ priority, value })
    this.bubbleUp()
  }

  pop(): T | undefined {
    if (this.size() === 0) return undefined
    const top = this.heap[0].value
    const last = this.heap.pop()!
    if (this.heap.length > 0) {
      this.heap[0] = last
      this.bubbleDown()
    }
    return top
  }

  size() {
    return this.heap.length
  }

  isEmpty() {
    return this.heap.length === 0
  }

  private bubbleUp() {
    let index = this.heap.length - 1
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      if (this.heap[index].priority >= this.heap[parentIndex].priority) break
      ;[this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]]
      index = parentIndex
    }
  }

  private bubbleDown() {
    let index = 0
    const length = this.heap.length
    while (true) {
      let leftChildIndex = 2 * index + 1
      let rightChildIndex = 2 * index + 2
      let swap = null

      if (leftChildIndex < length) {
        if (this.heap[leftChildIndex].priority < this.heap[index].priority) {
          swap = leftChildIndex
        }
      }

      if (rightChildIndex < length) {
        if (
          (swap === null && this.heap[rightChildIndex].priority < this.heap[index].priority) ||
          (swap !== null && this.heap[rightChildIndex].priority < this.heap[leftChildIndex].priority)
        ) {
          swap = rightChildIndex
        }
      }

      if (swap === null) break
      ;[this.heap[index], this.heap[swap]] = [this.heap[swap], this.heap[index]]
      index = swap
    }
  }
}
