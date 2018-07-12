var shirt_colors = ["red shirt", "blue shirt", "green shirt", "yellow shirt"]

// make a single context with some known number of people with apples (and the rest having the alternative fruit)
var makeSingleContext = function(alternative_fruit, n_with_apples, n_total) {
  map(function(i) {
    if (i < n_with_apples) {
      return {fruit: "apples", shirt: shirt_colors[i]}
    } else {
      return {fruit: alternative_fruit, shirt: shirt_colors[i]}
    }
  }, _.range(0, n_total))
}

// make an array of 4 contexts with the different numbers of people with the target vs. alternative fruiit
var makeQuadrantContexts = function(alternative_fruit) {
  return map(
    function(n_w_apples) {
      makeSingleContext(alternative_fruit, n_w_apples, 3)
    }, _.range(0, 4))
}

var allContexts = {
  nonexistence: makeQuadrantContexts(false),
  alternative:  makeQuadrantContexts("oranges")
}

var allReferents = {
  nonexistence_neg: {fruit: false, shirt: "yellow shirt"},
  alternative_neg: {fruit: "oranges", shirt: "yellow shirt"},
  nonexistence_pos: {fruit: "apples", shirt: "yellow shirt"},
  alternative_pos: {fruit: "apples", shirt: "yellow shirt"}
}

var isNegation = function(utt){
  return (utt.indexOf("no") > -1)
};

// set of utterances
var utterances = [
  "apples", "oranges", "no apples", "no oranges",
  "red shirt", "blue shirt", "green shirt", "yellow shirt"
]

var cost_per_word = 1; // cost of saying 2 words
var cost_neg = 0; // cost of saying negation (above and beyond cost of 2nd word)

var uttProbs = map(function(u) {
  var n_words = u.split(' ').length
  var uttCost = (n_words - 1)*cost_per_word + isNegation(u)*cost_neg
  return Math.exp(-uttCost)
}, utterances)

var utterancePrior = Categorical({
  vs: utterances,
  ps: uttProbs
})

// prior over world states
var objectPrior = function(objects) {
  var obj = uniformDraw(objects)
  return obj
}

// meaning function to interpret the utterances
var meaning = function(utterance, obj){
  // if utt has negation, split off the positive aspect of utterance
  var u = isNegation(utterance) ? utterance.split("no ")[1] : utterance;
  // check to see if utt is about shirt or fruit
  var referent_property = u.indexOf("shirt") > - 1 ? "shirt" : "fruit"
  // does object have property?
  var obj_property_val = obj[referent_property] == u? 1 : -1
  // if there's negation, multiply truth value by -1
  var neg_val = isNegation(utterance) ? -1 : 1
  return ((neg_val * obj_property_val) == 1) ? 0.999 : 0.001
}

var qudFns = {
  "apples?": function(obj){ return obj.fruit == "apples"},
  "which fruit?": function(obj){ return obj.fruit },
  "which referent?": function(obj){ return obj }
}

// literal listener
var literalListener = function(utterance, qud, allObjects){
  Infer({model: function(){
    var obj = objectPrior(allObjects);
    var qudFn = qudFns[qud]
    condition(flip(meaning(utterance, obj)))
    //     return [obj, qudFn(obj)]
    return qudFn(obj)
  }})
}

// set speaker optimality
var alpha = 1

// pragmatic speaker
var speaker = function(obj, context, qud){
  Infer({model: function(){
    var allObjects = context.concat(obj) // to make the listener's state prior
    var utterance = sample(utterancePrior)
    var L0 = literalListener(utterance, qud, allObjects)
    var qudFn = qudFns[qud]
    condition(flip(meaning(utterance, obj))) // strongly prefer to say true things
    factor(alpha * L0.score(qudFn(obj))) // informativity
    return utterance
  }})
}

//display(allContexts.nonexistence[0])

// now iterate through incoming data and give outputs
var allResults = mapIndexed(
  function(i, df_row) {
    var referent = df_row.referent == "nonexistence" ? 
    (df_row.utterance == "apples" ? allReferents.nonexistence_pos : allReferents.nonexistence_neg) : 
    (df_row.utterance == "apples" ? allReferents.alternative_pos : allReferents.alternative_neg)
    
    var context = df_row.context == "nonexistence" ? allContexts.nonexistence : allContexts.alternative
  
  
    var S1 = speaker(referent, context[df_row.n_with_apples], df_row.QUD)
    
    return Math.exp(S1.score(df_row.utterance))
  }, df
)

// return arrays
allResults

