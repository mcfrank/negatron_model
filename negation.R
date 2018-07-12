library(tidyverse)

# Nonexistence context, Nonexistence referent, apples? QUD
nna <- tibble(ratio = c("ratio0", "ratio1", "ratio2", "ratio3"),
              probs = c(0.3323976330361966, 0.39954163105573637, 0.37453297805618113, 0.3323976330361966),
              context = "nonexistence context",
              referent = "nonexistence referent", 
              qud = "apples?")

naa <- tibble(ratio = c("ratio0", "ratio1", "ratio2", "ratio3"), 
              probs = c(0.21163990547702688, 0.21189634570055743, 0.21192713113692455, 0.21163990547702688),
              context = "nonexistence context",
              referent = "alternative referent", 
              qud = "apples?")

anw <- tibble(ratio = c("ratio0", "ratio1", "ratio2", "ratio3"), 
              probs = c(0.3323976330361966, 0.39954163105573637, 0.250144737147453, 0.11137364942458249),
              context = "alternative context",
              referent = "nonexistence referent", 
              qud = "fruit?") 

aaw <- tibble(ratio = c("ratio0", "ratio1", "ratio2", "ratio3"), 
              probs = c(0.21163990547702688, 0.21189634570055743, 0.2118886285786924, 0.21163990547702688),
              context = "alternative context",
              referent = "alternative referent", 
              qud = "fruit?") 


d <- bind_rows(nna,naa,anw,aaw) %>%
  mutate(surprisal = -log(probs))

ggplot(d, aes(x = ratio, y = surprisal)) +
  geom_line(aes(group = 1), size = 1) +
  ylab("Speaker Surprisal") + 
  xlab("Context Condition") + 
  ylim(.8,2.2) +
  theme_bw() + 
  facet_grid(context~ referent)

M.Frank and collaborators
the Stanford Language & Cognition Lab 