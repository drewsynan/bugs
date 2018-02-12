library(readr)
library(ca)
library(dplyr)
library(tibble)

setwd("~/Desktop/bugs")
bugs.raw <- read_csv("7roomsFamilies.csv")

total.rooms <- bugs.raw$roomUnique %>% unique %>% length
total.houses <- bugs.raw$houseID %>% unique %>% length

collapsed.to.unique.room <- bugs.raw %>%
  group_by(roomUnique, roomType, Order, Family) %>%
  summarize(n = sum(numMS)) %>%
  mutate(present = 1) %>% 
  ungroup

filtered <- collapsed.to.unique.room %>%
  filter(!(Order %in% c("Un ID order", "No specimens")))

order_family_lookup <- select(bugs.raw, family = Family, order = Order) %>% distinct


xt <- xtabs(present ~ Family + roomType, data = filtered)
fit <- ca(xt)
plot(fit, labels = c(FALSE, FALSE))
ca_family <- as.data.frame(fit$rowcoord) %>% 
  rownames_to_column(., var = "value") %>%
  mutate(variable = "family", family = value) %>%
  inner_join(., order_family_lookup, by=c('family' = 'family')) %>%
  separate(., order, c('order', 'order_junk'), sep="\\s\\(") %>%
  separate(., family, c('family', 'family_junk'), sep="\\s\\(") %>%
  select(-order_junk, -family_junk) %>%
  distinct

ca_room <- as.data.frame(fit$colcoord) %>% 
  rownames_to_column(., var="value") %>%
  mutate(variable = "room", family = '', order = '')

ca_bugs <- bind_rows(ca_family, ca_room)

write_csv(ca_bugs, "ca.csv")



test <- bugs.raw %>% group_by(houseID, roomUnique, Order) %>%
  filter(row_number() == 1) %>%
  mutate(num_orders = n()) %>%
  ungroup %>%
  select(houseID, roomUnique, roomType, num_orders)

ggplot(test, aes(area=num_orders, fill=roomType)) + geom_treemap()
