using UnityEngine;
using NeonProtocol.Core.Input;

namespace NeonProtocol.Core.Movement
{
    [RequireComponent(typeof(CharacterController))]
    public class NeonMovement : MonoBehaviour
    {
        public static NeonMovement Instance;

        [Header("Settings")]
        [SerializeField] private float walkSpeed = 6f;
        [SerializeField] private float sprintSpeed = 10f;
        [SerializeField] private float slideForce = 15f;
        [SerializeField] private float jumpForce = 8f;
        [SerializeField] private float gravity = -20f;
        [SerializeField] private float slideDuration = 0.8f;

        private CharacterController _controller;
        private Vector3 _velocity;
        private bool _isSliding;
        private float _slideTimer;
        private Vector3 _slideDir;
        private float _gravityMultiplier = 1.0f;
        private float _sprintSpeedMultiplier = 1.0f;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            _controller = GetComponent<CharacterController>();
        }

        private void Update()
        {
            bool isGrounded = _controller.isGrounded;
            if (isGrounded && _velocity.y < 0) _velocity.y = -2f;

            HandleMovement();
            HandleJump();
            ApplyGravity();
        }

        private void HandleMovement()
        {
            Vector2 input = NeonInputHandler.Instance.MoveInput;
            Vector3 move = transform.right * input.x + transform.forward * input.y;

            // Sprint Logic
            bool isSprinting = NeonInputHandler.Instance.SprintInput && input.y > 0;
            float currentSpeed = isSprinting ? sprintSpeed * _sprintSpeedMultiplier : walkSpeed;

            // Slide Logic (G-Slide)
            if (NeonInputHandler.Instance.CrouchInput && isSprinting && !_isSliding)
            {
                StartSlide(move);
            }

            if (_isSliding)
            {
                _slideTimer -= Time.deltaTime;
                _controller.Move(_slideDir * slideForce * Time.deltaTime);

                // Camera dip effect logic would go here

                if (_slideTimer <= 0) _isSliding = false;
            }
            else
            {
                _controller.Move(move * currentSpeed * Time.deltaTime);
            }
        }

        private void StartSlide(Vector3 direction)
        {
            _isSliding = true;
            _slideTimer = slideDuration;
            _slideDir = direction.normalized;
        }

        private void HandleJump()
        {
            if (NeonInputHandler.Instance.JumpInput && _controller.isGrounded)
            {
                float jumpBoost = _isSliding ? 1.2f : 1.0f; // Bunny Hop momentum
                _velocity.y = Mathf.Sqrt(jumpForce * jumpBoost * -2f * gravity);

                // If jumping out of a slide, convert slide momentum to air velocity
                if (_isSliding)
                {
                    // This is simplified; normally you'd add lateral velocity to _velocity
                    // But CharacterController handles move() separately often.
                    // For true momentum, we'd add force to a momentum vector.
                    _isSliding = false;
                }
            }
        }

        private void ApplyGravity()
        {
            _velocity.y += gravity * _gravityMultiplier * Time.deltaTime;
            _controller.Move(_velocity * Time.deltaTime);
        }

        /// <summary>Sets a gravity scale factor (e.g. 0.3 for low-gravity zones, 1.0 to restore).</summary>
        public void SetGravityMultiplier(float multiplier) => _gravityMultiplier = multiplier;

        /// <summary>Multiplies sprint speed by the given factor (e.g. RacingStripes perk).</summary>
        public void ApplySprintBoost(float multiplier) => _sprintSpeedMultiplier = multiplier;
    }
}
