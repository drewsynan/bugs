library(dplyr)
library(stringr)
library(ggplot2)
library(tidyr)
library(readr)
library(treemapify)

setwd("~/Desktop/bugs")
bugs.raw <- read_csv("7roomsFamilies.csv")

summary <- bugs.raw %>% group_by(roomType) %>% summarise(total = mean(numMS, na.rm = TRUE))

summary_grouped <- function(n) {
  grouped <- bugs.raw %>% 
    group_by(roomType, Order) %>% 
    summarise(total = sum(numMS, na.rm = TRUE)) %>%
    mutate(rank = dense_rank(desc(total)))
  
  if (is.na(n)) {
    return(grouped)
  }
  
  top_rank <- grouped %>% filter(rank <= n)
  rest <- grouped %>% 
    filter(rank < n) %>%
    ungroup %>%
    group_by(roomType) %>%
    summarise(total = sum(total)) %>%
    mutate(Order = "other", rank=n+1) %>%
    select(roomType, Order, total, rank)
  
  bind_rows(top_rank, rest)
}

grouped_houses <- bugs.raw %>% 
  group_by(houseID, roomType, Order) %>% 
  summarise(total = sum(numMS, na.rm = TRUE)) %>%
  mutate(rank = dense_rank(desc(total)))

summary_houses <- bugs.raw %>%
  group_by(houseID, roomType) %>%
  summarise(total = sum(numMS, na.rm = TRUE))

ggplot(summary, aes(area = total, fill = roomType)) + geom_treemap()
ggplot(summary_grouped(NA), aes(area = total, fill = Order, subgroup = roomType, label=Order)) +
  theme(legend.position="none") + 
  geom_treemap() + 
  geom_treemap_subgroup_border() + 
  geom_treemap_subgroup_text(place = "topleft", colour = "black", min.size = 0)
  #geom_treemap_text(colour = "white", place="center")

# detailed view showing inner room order coloring
ggplot(grouped_houses, aes(area = total, fill = Order, subgroup = roomType, label=Order)) +
  theme(legend.position="none") + 
  geom_treemap() + 
  geom_treemap_subgroup_border() + 
  geom_treemap_subgroup_text(place = "topleft", colour = "black", min.size = 0) +
  facet_wrap(~houseID)

# detailed view showing inner room order coloring, no labels
ggplot(grouped_houses, aes(area = total, fill = Order, subgroup = roomType, label=Order)) +
  theme(legend.position="none") + 
  geom_treemap() + 
  geom_treemap_subgroup_border() + 
  facet_wrap(~houseID)

# view showing just room totals
ggplot(summary_houses, aes(area = total, fill = roomType, label=roomType)) +
  theme(legend.position="none") + 
  geom_treemap() + 
  geom_treemap_text(place = "topleft", colour = "black", min.size = 0) +
  facet_wrap(~houseID)

#no labels
ggplot(summary_houses, aes(area = total, fill = roomType, label=roomType)) +
  theme(legend.position="none") + 
  geom_treemap() + 
  facet_wrap(~houseID)

# room type counts

### matches Table 1 from article
room_types <- bugs.raw %>%
  group_by(roomType, roomUnique) %>%
  summarise(present = TRUE) %>%
  ungroup %>%
  group_by(roomType) %>%
  summarise(room_total = n())

room_types_order <- bugs.raw %>%
  group_by(roomType, roomUnique, Order) %>%
  summarise(room_count = n()) %>%
  ungroup %>%
  group_by(roomType, Order) %>%
  summarise(order_room_total = n()) %>%
  ungroup %>%
  select(roomType, Order, order_room_total)

# bug counts
room_types_present <- bugs.raw %>%
  group_by(roomType, roomUnique, Order, Family) %>%
  summarise(present = n() > 0) %>%
  ungroup %>%
  group_by(roomType, Order, Family) %>%
  summarise(present = n()) %>%
  left_join(room_types) %>%
  ungroup %>%
  left_join(room_types_order, by=c('Order'='Order', 'roomType'='roomType')) %>%
  mutate(absent = room_total - present)

roomslong <- melt(room_types_present, id.vars = c("roomType", "Order", "Family")) %>%
  mutate(order = Order, family = Family, room = roomType, variable = as.character(variable)) %>%
  select(room, order, family, variable, value)

ggplot(roomslong) + 
  geom_mosaic(aes(weight=value, 
                  x=product(room), 
                  fill=factor(variable))) + facet_wrap(~order)


roomslongd3 <- bind_rows(
  roomslong %>%
    group_by(room, order, family, variable) %>%
    filter(row_number() == 1) %>%
    mutate(id = str_c("house", room, order, family, variable, sep=".")),
  
  roomslong %>%
    group_by(room, order, family) %>%
    filter(row_number() == 1) %>%
    mutate(variable = NA, value = NA) %>%
    mutate(id = str_c("house", room, order, family, sep=".")),
  
  roomslong %>%
    group_by(room, order) %>%
    filter(row_number() == 1) %>%
    mutate(family = NA, variable = NA, value = NA) %>%
    mutate(id = str_c("house", room, order, sep=".")),
  
  roomslong %>%
    group_by(room) %>%
    filter(row_number() == 1) %>%
    mutate(order = NA, family = NA, variable = NA, value = NA) %>%
    mutate(id = str_c("house", room, sep=".")),
  
  roomslong %>%
    filter(row_number() ==1) %>%
    mutate(room = NA, order = NA, family = NA, variable = NA, value = NA) %>%
    mutate(id = "house")
) %>% 
  separate(., order, c('order', 'order_common'), sep="\\s\\(") %>%
  mutate(order_common = (function(x) {str_replace(x, "\\)", "")})(order_common)) %>%
  separate(., family, c('family', 'family_common'), sep="\\s\\(") %>%
  mutate(family_common = (function(x) {str_replace(x, "\\)", "")})(family_common)) %>%
  ungroup %>%
  replace(is.na(.), "")

write_csv(roomslongd3, "rooms_present_absent.csv")

room_present_xtab <- xtabs(cbind(present, absent) ~ Order + roomType, data = room_types_present)



room_types_present_d3 <- rbind(
  room_types_present %>%
    ungroup %>%
    select(roomType, Order, Family, present, absent, room_total, order_room_total) %>%
    mutate(id = str_c("house", roomType, Order, Family, sep="."),
           order = Order,
           family = Family,
           room = roomType,
           absent = absent,
           room_total = room_total,
           order_room_total = order_room_total,
           value = present) %>%
    separate(., order, c('order', 'order_common'), sep="\\s\\(") %>%
    mutate(order_common = (function(x) {str_replace(x, "\\)", "")})(order_common)) %>%
    separate(., family, c('family', 'family_common'), sep="\\s\\(") %>%
    mutate(family_common = (function(x) {str_replace(x, "\\)", "")})(family_common)) %>%
    replace(is.na(.), "") %>%
    select(id, room, order, order_common, family, family_common, value, absent, room_total, order_room_total),
  room_types_present %>%
    group_by(roomType, Order) %>%
    filter(row_number() == 1) %>%
    mutate(id = str_c("house", roomType, Order, sep="."),
           room = roomType,
           room_total = '',
           value = '',
           absent = '',
           order = Order,
           family = '',
           room_total = '',
           order_room_total = '',
           family_common = '') %>%
    separate(., order, c('order', 'order_common'), sep="\\s\\(") %>%
    mutate(order_common = (function(x) {str_replace(x, "\\)", "")})(order_common)) %>%
    ungroup %>%
    select(id, room, order, order_common, family, family_common, value, absent, room_total, order_room_total),
  room_types_present %>%
    group_by(roomType) %>%
    filter(row_number() == 1) %>%
    mutate(id = str_c("house", roomType, sep="."),
           room = roomType,
           value = '',
           family = '',
           absent = '',
           room_total = '',
           order_room_total = '',
           family_common = '',
           order = '',
           order_common = '') %>%
    ungroup %>%
    select(id, room, order, order_common, family, family_common, value, absent, room_total, order_room_total),
  room_types_present %>%
    filter(row_number() == 1) %>%
    mutate(id = "house", 
           value = '',
           absent = '',
           room_total = '',
           order_room_total = '',
           room = '',
           value = '',
           family = '',
           family_common = '',
           order = '',
           order_common = '') %>%
    select(id, room, order, order_common, family, family_common, value, absent, room_total, order_room_total)
)

write_csv(room_types_present_d3, "present_in_room.csv")


### prepare data for d3 export ###
### totals by room ###
house.totals <- bugs.raw %>%
  summarise(n = sum(numMS, na.rm = TRUE)) %>%
  mutate(id = "house", value = '') %>%
  select(id, value)

house.room.totals <- bugs.raw %>%
  group_by(roomType) %>%
  summarise(n = sum(numMS, na.rm = TRUE)) %>%
  mutate(id = str_c("house", roomType, sep="."), n = '') %>%
  ungroup %>%
  select(id, value = n)

house.room.order.totals <- bugs.raw %>%
  group_by(roomType, Order) %>%
  summarise(n = sum(numMS, na.rm = TRUE)) %>%
  mutate(id = str_c("house", roomType, Order, sep="."), n = '') %>%
  ungroup %>%
  select(id, value = n)

house.room.order.family.totals <- bugs.raw %>%
  group_by(roomType, Order, Family) %>%
  summarise(n = sum(numMS, na.rm = TRUE)) %>%
  mutate(id = str_c("house", roomType, Order, Family, sep=".")) %>%
  ungroup %>%
  select(id, value = n)

house.all.totals <- rbind(house.totals,
                          house.room.totals, 
                          house.room.order.totals, 
                          house.room.order.family.totals) %>%
  arrange(id)


house.all.totals.pieces <- house.all.totals %>%
  mutate(id_to_split = id) %>%
  separate(., id_to_split, c('house', 'room', 'order', 'family'), sep="\\.") %>%
  replace(is.na(.), "") %>%
  separate(., order, c('order', 'order_common'), sep="\\s\\(") %>%
  mutate(order_common = (function(x) { str_replace(x, "\\)", "") })(order_common)) %>%
  separate(., family, c('family', 'family_common'), sep="\\s\\(") %>%
  mutate(family_common = (function(x) { str_replace(x, "\\)", "") })(family_common)) %>%
  replace(is.na(.), "") %>%
  select(id, value, room, order, order_common, family, family_common) %>%
  arrange(id)

write_csv(house.all.totals.pieces, "room_totals.csv")

###############
###############
# data for small order selector

house.totals.order.selector <- bugs.raw %>%
  group_by(Order) %>%
  summarise(n = sum(numMS, na.rm = TRUE)) %>%
  ungroup %>%
  mutate(order = Order, value = n, id = str_c("house.",Order)) %>%
  separate(., order, c('order', 'order_common'), sep="\\s\\(") %>%
  mutate(order_common = (function(x) {str_replace(x, "\\)", "")})(order_common)) %>%
  replace(is.na(.), "") %>%
  select(id, order, order_common, value) %>%
  add_row(id = "house", order = "", order_common = "", value = "")

write_csv(house.totals.order.selector, "order_selector.csv")



##############
##############

### totals by family first ###
bugs.totals <- bugs.raw %>%
  summarise(n = sum(numMS, na.rm = TRUE)) %>%
  mutate(id = "bugs", value = '') %>%
  select(id, value)

bugs.order.totals <- bugs.raw %>%
  group_by(Order) %>%
  summarise(n = sum(numMS, na.rm = TRUE)) %>%
  mutate(id = str_c("bugs", Order, sep="."), value = '') %>%
  ungroup %>%
  select(id, value)

bugs.order.family.totals <- bugs.raw %>%
  group_by(Order, Family) %>%
  summarise(n = sum(numMS, na.rm = TRUE)) %>%
  mutate(id = str_c("bugs", Order, Family, sep="."), value = '') %>%
  ungroup %>%
  select(id, value)

bugs.order.family.room.totals <- bugs.raw %>%
  group_by(Order, Family, roomType) %>%
  summarise(n = sum(numMS, na.rm = TRUE)) %>%
  mutate(id = str_c("bugs", Order, Family, roomType, sep=".")) %>%
  ungroup %>%
  select(id, value = n)

bugs.all.totals <- rbind(bugs.totals,
                         bugs.order.totals,
                         bugs.order.family.totals,
                         bugs.order.family.room.totals) %>%
  arrange(id)

write_csv(bugs.all.totals, "bug_totals.csv")
