display("===Quadrant 1: nonexistence context, nonexistence referent, apples? qud===")
var allResults = mapIndexed(
  function(i, ctxt){
    display("----" + i + " out of 3 with apples")
    
    display('P(speaker says "no apples") = ' + Math.exp(S1.score("no apples")))
    //     viz.table(S1) // full model predictions
  }, allContexts.nonexistence
)

display("===Quadrant 2: nonexistence context, alternative referent, apples? qud===")
var allResults = mapIndexed(
  function(i, ctxt){
    display("----" + i + " out of 3 with apples")
    var S1 = speaker(allReferents.alternative, ctxt, "apples?")
    display('P(speaker says "no apples") = ' + Math.exp(S1.score("no apples")))
    //     viz.table(S1) // full model predictions
  }, allContexts.nonexistence
)

display("===Quadrant 3: alternative context, nonexistence referent, which fruit? qud===")
var allResults = mapIndexed(
  function(i, ctxt){
    display("----" + i + " out of 3 with apples")
    var S1 = speaker(allReferents.nonexistence, ctxt, "which fruit?")
    display('P(speaker says "no apples") = ' + Math.exp(S1.score("no apples")))
    //     viz.table(S1) // full model predictions
  }, allContexts.alternative
)

display("===Quadrant 4: alternative context, alternative referent, which fruit? qud===")
var allResults = mapIndexed(
  function(i, ctxt){
    display("----" + i + " out of 3 with apples")
    var S1 = speaker(allReferents.alternative, ctxt, "which fruit?")
    display('P(speaker says "no apples") = ' + Math.exp(S1.score("no apples")))
    //     viz.table(S1) // full model predictions
  }, allContexts.alternative
)
