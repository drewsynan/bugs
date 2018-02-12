bugs.raw <- read_csv("7roomsFamilies.csv")

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
