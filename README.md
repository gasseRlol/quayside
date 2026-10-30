# Quayside: ship supply desk (demo)

A web demo of the kind of system a ship chandler (a company that supplies ships with spare parts, stores and food while they are in port) uses every day. It is modelled on a real company's Windows desktop system, but with a made-up name and sample data.

**Live demo:** https://gasserlol.github.io/quayside/

**Run it locally:** `node server.js`, then open http://127.0.0.1:3500/quayside/ (the server lays Quayside and the tracker out like the public site, so they can talk to each other). Everything is saved in the browser (localStorage); "Reset demo" on the overview puts the sample data back.

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

## Connected to the delivery tracker

Every ship's order is followed in [Parcel Tracker](https://gasserlol.github.io/parcel-tracker/), the order tracker on the same site, in three stages: **with the supplier**, **in the warehouse**, **on the ship**. Each item shows its own stage.

1. As soon as something is ordered from a supplier, Quayside sends the order to the tracker and gets back a tracking code and a handover PIN for the ship. The operation page shows them, with **Customer link** and **Driver link**.
2. **Send out** on a delivery note makes it "Packed, waiting for a driver".
3. The driver opens the driver link on his phone, types his name and takes the job. When he taps **On my way**, his location shows on the map, for the customer and in Quayside.
4. At the ship he types the PIN the ship gives him. Quayside marks the note delivered by itself.
5. **Pretend driver** does the trip from this page, for testing alone (keep the page open while it drives).

It all goes through a **test room** online: everyone you send a link to sees the same thing, live, without signing in. Each Quayside (each browser) has its own room; the Deliveries page shows its code. **Start empty** clears the room too.

Everything can be removed with Undo: whole operations, orders, purchase orders, delivery notes and lines. Removing an operation removes it from the tracker as well.

The calls Quayside makes are in `../parcel-tracker/connect.js`. How a real company's system would connect the same way (messages, status mapping, what is still needed for the live version) is in [Parcel Tracker's CONNECT.md](https://github.com/gasseRlol/parcel-tracker/blob/main/CONNECT.md).
