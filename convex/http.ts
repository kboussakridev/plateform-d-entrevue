/** convex/http.ts */
// On importe le routeur HTTP de Convex
import { httpRouter } from "convex/server";
// Permet de créer une action HTTP sécurisée côté Convex
import { httpAction } from "./_generated/server";
// Type fourni par Clerk pour représenter un événement webhook
import { WebhookEvent } from "@clerk/nextjs/server";
// Librairie Svix pour vérifier la signature des webhooks Clerk
import { Webhook } from "svix";
// Accès aux fonctions/mutations Convex générées automatiquement
import { api } from "./_generated/api";

// Création du routeur HTTP
const http = httpRouter();

// Déclaration d'une route accessible via POST sur /clerk-webhook
http.route({
  path: "/clerk-webhook",
  method: "POST",

  // httpAction = fonction spéciale Convex pour traiter une requête HTTP
  handler: httpAction(async (ctx, request) => {
    // On récupère la clé secrète stockée dans les variables d’environnement
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    // Si la variable n’existe pas → on stoppe tout
    if (!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET environnement variable");
    }

    // On récupère les headers envoyés par Clerk pour la sécurité Svix
    const svix_id = request.headers.get("svix-id");
    const svix_signature = request.headers.get("svix-signature");
    const svix_timestamp = request.headers.get("svix-timestamp");

    // Si un des headers manque → la requête n’est pas fiable
    if (!svix_id || !svix_signature || !svix_timestamp) {
      return new Response("No svix headers found", {
        status: 400,
      });
    }

    // On récupère le contenu JSON envoyé par Clerk
    const payload = await request.json();

    // Svix a besoin du body sous forme de string
    const body = JSON.stringify(payload);

    // On crée un vérificateur Svix avec notre secret
    const wh = new Webhook(webhookSecret);

    // Variable qui contiendra l’événement vérifié
    let evt: WebhookEvent;

    try {
      // Vérification cryptographique du webhook
      // → on s’assure que ça vient bien de Clerk
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-signature": svix_signature,
        "svix-timestamp": svix_timestamp,
      }) as WebhookEvent;
    } catch (err) {
      // Si la signature est invalide → possible attaque
      console.error("Error verifying webhook:", err);
      return new Response("Error occurred", { status: 400 });
    }

    // Type d’événement envoyé par Clerk
    const eventType = evt.type;

    // On traite uniquement l’événement "user.created"
    if (eventType === "user.created") {
      // On extrait les infos utiles de l’utilisateur Clerk
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      // On prend le premier email de la liste
      const email = email_addresses[0].email_address;

      // On fabrique le nom complet proprement
      const name = `${first_name || ""} ${last_name || ""}`.trim();

      try {
        // On appelle une mutation Convex pour créer/synchroniser l’utilisateur
        await ctx.runMutation(api.users.syncUser, {
          clerkId: id,
          email,
          name,
          image: image_url,
        });
      } catch (error) {
        // Si l’enregistrement en base échoue
        console.log("Error creating user: ", error);
        return new Response("Error creating user", { status: 500 });
      }
    }

    // Tout s’est bien passé 👍
    return new Response("Webhook processed successfully", { status: 200 });
  }),
});

export default http;

