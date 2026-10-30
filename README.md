# Quayside: ship supply desk (demo)

A web demo of the kind of system a ship chandler (a company that supplies ships with spare parts, stores and food while they are in port) uses every day. It is modelled on a real company's Windows desktop system, but with a made-up name and sample data.

**Run it:** `node server.js`, then open http://127.0.0.1:3500. Everything is saved in the browser (localStorage); "Reset demo" on the overview puts the sample data back.

## What the system is for

One **operation** = one ship call. The flow follows the stepper on each operation:

1. **Request**: a ship (through its agent) says it will arrive at a port at a time (ETA) and sends a requisition: the list of what it needs.
2. **Quote**: each line gets a supplier, our buying cost and our selling price. The quotation can be printed for the ship.
3. **Purchase**: one purchase order per supplier is created from the priced lines.
4. **Receive**: suppliers deliver to our store; lines are marked received.
5. **Deliver**: received lines are packed on a **delivery note**, sent out to the ship (berth or anchorage, often by launch boat) and signed for on board.
6. **Invoice**: once everything is on board, the invoice is raised.

## How it maps to the screens in the original system

| Original | Here |
| --- | --- |
| Follow Operations (list with Operation #, Date, Vessel, Port, Marine user, Purchase user, Remark, "Count of Operations") | Operations |
| Operation form (Operation #, Vessel name, Agency, Port, Direction, From / To country, Marine user 1-3, Normal / Extension delivery, Arrival port, ETA, Op. serial #, Purchase remark) | Operation details |
| Orders List grid | Orders list |
| Items grid with "Show items: All items / By inquiry / Un-delivered", supplier and price columns | Items table (All / Not delivered / By order) |
| Follow Up Purchase Orders | Purchase orders |
| Print buttons | Quotation, purchase order, delivery note and invoice printouts |

## Files

- `index.html`: page frame and all styling
- `app.js`: screens, buttons and printouts
- `data.js`: sample data, the rules for each status, and every change (all changes can be undone)
- `server.js`: small local server

## Next step: connecting the delivery tracker

The delivery note is the piece the tracker (Parcel Tracker) follows:

1. When a delivery note is sent out, Quayside sends it to the tracker: note number, vessel, where to deliver (berth or anchorage with map position), lines.
2. The tracker answers with a tracking code and link. Quayside keeps it on the note (today it shows "Tracker: not linked yet") and can print it on the delivery note.
3. The driver or launch boat uses the tracker's courier screen: picked up, on the way (live phone location), delivered with the handover PIN.
4. The tracker tells Quayside each status change, so the delivery note moves to "On the way" and "Delivered" by itself.

For the real company the same messages would go between the tracker and their system through a small connector on their side.
