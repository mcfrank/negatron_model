
// adapted from mhtess/webppl-oed
// If pProp is specified, then Q is scored with that property of P support
// elements (necessary if model posterior contains extra information)
var KL = function(P, Q, pProp) {
    var statesP = P.support();
    var statesQ = Q.support();

    // TODO: assert that states1 = states2
    return sum(map(
        function(state) {
            var scoreP = P.score(state);
            var scoreQ = Q.score((!!pProp) ? state[pProp] : state);
            var probP = Math.exp(scoreP);
            // P(i) * log[ P(i) / Q(i) ] =  P(i) * [log(P(i) - log(Q(i)))]
            // Let \lim_{x \to 0} x \log(x) = 0.
            // Otherwise, 0 * -Infinity = NaN.
            if (probP === 0) {
                return 0;
            }
            return probP * (scoreP - scoreQ);
        },
        statesP));
}


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
var utterances_noshirts = [
  "apples", "oranges", "no apples", "no oranges"
]

var utterances_withshirts = [
  "apples", "oranges", "no apples", "no oranges","red shirt", "blue shirt", "green shirt", "yellow shirt"
]


var utterancePrior = cache(function(cost_per_word, with_shirt_utts){
  // var cost_per_word = 1; // cost of saying 2 words
  var cost_neg = 0; // cost of saying negation (above and beyond cost of 2nd word)
  var utts = with_shirt_utts ? utterances_withshirts : utterances_noshirts
  // display(with_shirt_utts + " " + utts)
  
  var uttProbs = map(function(u) {
    var n_words = u.split(' ').length
    var uttCost = (n_words - 1)*cost_per_word + isNegation(u)*cost_neg
    return Math.exp(-uttCost)
  }, utts)

  return Categorical({
    vs: utts,
    ps: uttProbs
  })
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


// uniform prior on QUDs (those listed in qudFns)
var qudPrior = Categorical({
  vs: _.keys(qudFns),
  ps: repeat(_.keys(qudFns).length, function(){1})
})


// literal listener
var literalListener = function(utterance, qud, L0_prior){
  Infer({model: function(){
    var obj = sample(L0_prior);
    var qudFn = qudFns[qud]
    condition(flip(meaning(utterance, obj)))
    //     return [obj, qudFn(obj)]
    return qudFn(obj)
  }})
}

var projectPriorOntoQud = function(qud, L0_prior){
  Infer({model: function(){
    var obj = sample(L0_prior);
    var qudFn = qudFns[qud]
    return qudFn(obj)
  }})
}

// set speaker optimality
 // var alpha = 1

// pragmatic speaker
// var speaker = function(obj, context, qud, alph, cost){
var qudInference = function(obj, context, cost, with_shirt_utts, consider_referent){
    var allObjects = consider_referent ? context.concat(obj) : context // to make the listener's state prior
    
    var L0_prior = Categorical({vs: allObjects, 
        ps: repeat(allObjects.length, function(){1})})
    // display(JSON.stringify(L0_prior))
    
    
    _.fromPairs(map(function(qud){
        var expectedInfoGain = expectation(Infer({model: function(){
            var utterance = sample(utterancePrior(cost, with_shirt_utts))
            var L0_posterior = literalListener(utterance, qud, L0_prior)
            var informationGain = KL(L0_posterior, projectPriorOntoQud(qud, L0_prior))
            return informationGain
        }}))
       return [qud, expectedInfoGain]
    }, _.keys(qudFns)))
  
}

//display(allContexts.nonexistence[0])

// now iterate through incoming data and give outputs
var allResults = mapIndexed(
  function(i, df_row) {
   display(JSON.stringify(df_row))
    var referent = df_row.referent == "nonexistence" ? 
    (df_row.utterance == "apples" ? allReferents.nonexistence_pos : allReferents.nonexistence_neg) : 
    (df_row.utterance == "apples" ? allReferents.alternative_pos : allReferents.alternative_neg)
    
    var context = df_row.context == "nonexistence" ? allContexts.nonexistence : allContexts.alternative
  
    // var S1 = speaker(referent, context[df_row.n_with_apples], df_row.QUD, df_row.alpha, df_row.cost)
    // display(df_row.with_shirt_utts)
    var S1 = qudInference(referent, context[df_row.n_with_apples], df_row.cost,
    df_row.with_shirt_utts, df_row.consider_referent)
    return extend(df_row, S1)
  }, df
)

allResults


// var df_row  = {
//     "referent": "nonexistence",
//     "context": "alternative",
//     "n_with_apples": 0,
//     "QUD": "which fruit?",
//     "utterance": "no apples",
//     "alpha": 9,
//     "cost": 9
//   }

// // df_row
// var referent = df_row.referent == "nonexistence" ? 
// (df_row.utterance == "apples" ? allReferents.nonexistence_pos : allReferents.nonexistence_neg) : 
// (df_row.utterance == "apples" ? allReferents.alternative_pos : allReferents.alternative_neg)

// var context = df_row.context == "nonexistence" ? allContexts.nonexistence : allContexts.alternative

// var S1 = speaker(referent, context[df_row.n_with_apples], df_row.QUD, df_row.alpha, df_row.cost)
// S1
// return arrays

