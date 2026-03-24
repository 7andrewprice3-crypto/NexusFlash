using UnityEngine;
using NeonProtocol.Core.Player;
using NeonProtocol.Core.Movement;
using NeonProtocol.Core.Combat;

namespace NeonProtocol.Core.Interactions
{
    // Unified PerkType enum shared by NeonPerkMachine and PerkMachine.
    // All values from both classes have been merged here to avoid duplicate-enum
    // compilation errors (both scripts live in the same namespace).
    public enum PerkType
    {
        TuffNuff,      // Juggernog — 250 HP
        Quickies,      // Speed Cola — faster reload
        BangBangs,     // Double Tap — double damage + fire rate
        RacingStripes, // Stamin-Up — sprint speed boost
        BlueBolts,     // Electric Cherry equivalent
        UpNAtoms,      // PHD Flopper / Up N Atoms — self-revive
        TrailBlazers   // No fall damage + slide AOE
    }

    public class NeonPerkMachine : NeonInteractable
    {
        [Header("Perk Settings")]
        [SerializeField] private PerkType perkType;

        protected override void OnPurchaseSuccess()
        {
            Debug.Log($"Drank {perkType}!");
            ApplyPerkEffect();
        }

        private void ApplyPerkEffect()
        {
            switch (perkType)
            {
                case PerkType.TuffNuff: // Juggernog equivalent — increases max health to 250
                    if (PlayerHealth.Instance != null)
                        PlayerHealth.Instance.ApplyTuffNuff();
                    break;

                case PerkType.RacingStripes: // Stamin-Up — boosts sprint speed by 40 %
                    if (NeonMovement.Instance != null)
                        NeonMovement.Instance.ApplySprintBoost(1.4f);
                    break;

                case PerkType.Quickies: // Speed Cola — halves reload time
                    if (PlayerCombat.Instance != null)
                        PlayerCombat.Instance.reloadTimeMultiplier = 0.5f;
                    break;

                case PerkType.BangBangs: // Double Tap — doubles damage & increases fire rate
                    if (PlayerCombat.Instance != null)
                    {
                        PlayerCombat.Instance.damageMultiplier *= 2.0f;
                        PlayerCombat.Instance.fireRateMultiplier *= 0.67f;
                    }
                    break;

                case PerkType.UpNAtoms: // Self-revive
                    if (PlayerHealth.Instance != null)
                        PlayerHealth.Instance.hasUpNAtoms = true;
                    break;

                case PerkType.BlueBolts:
                    // Electric Cherry: damage on reload — placeholder for future implementation
                    Debug.Log("Blue Bolts Active: Electric discharge on reload.");
                    break;

                case PerkType.TrailBlazers:
                    // No fall damage + slide explosions — placeholder for future implementation
                    Debug.Log("Trail Blazers Active: No fall damage & sliding explosions.");
                    break;
            }
        }
    }
}
