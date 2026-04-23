import { coreSearchUseCase, ndp } from "../src/application/coreSearch.usecase"

function testDirect() {
  const results = coreSearchUseCase("Mirpur 11", "Badda");
  console.log(`Total results found by coreSearchUseCase: ${results.length}`);
  results.forEach((r, i) => {
    console.log(`Result ${i + 1}: Type=${r.type}, Transfers=${r.transfers}, Route=${r.primaryRouteId}, Hops=${r.path.length}`);
  });
}

testDirect();
