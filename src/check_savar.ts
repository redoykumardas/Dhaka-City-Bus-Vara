
import { buildRoutesUseCase } from "./application/buildRoutes.usecase"
import { dijkstraAdapter } from "./modules/routing/dijkstra.adapter"
import { staticBusAdapter } from "./modules/buses/staticBus.adapter"
import { simpleFareAdapter } from "./modules/fare/simpleFare.adapter"
import { simpleTimeAdapter, buildTimeTable } from "./modules/time/simpleTime.adapter"
import { getGraph, getBusDB, expandRoutePath } from "./infrastructure/graph.data"
import { getFareTable } from "./infrastructure/fare.data"
import { normalizeStop } from "./domain/stopNormalizer"

async function run() {
  const from = normalizeStop("Khilkhet")
  const to = normalizeStop("Savar")

  const graph = getGraph()
  const busDB = getBusDB()
  const fareTable = getFareTable()
  const timeTable = buildTimeTable(fareTable)

  const routes = buildRoutesUseCase({
    routing: dijkstraAdapter,
    bus: staticBusAdapter,
    fare: simpleFareAdapter,
    time: simpleTimeAdapter,
    graph,
    busDB,
    fareTable,
    timeTable,
    from,
    to,
    maxPaths: 3,
    expandPath: expandRoutePath
  })

  console.log(JSON.stringify(routes, null, 2))
}

run().catch(console.error)
